import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
    jest,
  } from "@jest/globals";
  import mongoose from "mongoose";
  import { MongoMemoryReplSet } from "mongodb-memory-server";
  import request from "supertest";
  import bcrypt from "bcryptjs";
  import { signAccessToken } from "../../../server/src/middleware/auth.js";
  
  jest.unstable_mockModule("../../../server/src/middleware/uploadImage.js", () => ({
    default: (req, res, next) => {
      req.file = {
        path: "https://example.com/mock-avatar.png",
        secure_url: "https://example.com/mock-avatar.png",
      };
      next();
    },
  }));
  
  let app;
  let mongoServer;
  
  async function waitForMongoReady() {
    for (let i = 0; i < 80; i++) {
      if (mongoose.connection.readyState === 1) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error("MongoDB did not become ready");
  }
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoServer.waitUntilRunning();
      process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = "jest-test-secret";
    process.env.NODE_ENV = "test";
    const mod = await import("../../../server/src/app.js");
    app = mod.app;
    await waitForMongoReady();
  }, 120000);
  
  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });
  
  beforeEach(async () => {
    const cols = mongoose.connection.collections;
    for (const key of Object.keys(cols)) {
      await cols[key].deleteMany({});
    }
  });
  
  async function createUser(email, username) {
    const { default: User } = await import("../../../server/src/models/user.js");
    return User.create({
      username,
      email,
      passwordHash: await bcrypt.hash("Password1!", 10),
      profileImage: "https://example.com/avatar.png",
      location: "Kelowna, BC",
    });
  }
  
  async function createBook(ownerId, overrides = {}) {
    const { default: Book } = await import("../../../server/src/models/book.js");
    return Book.create({
      bookTitle: "Test Book",
      bookAuthor: "Test Author",
      bookImage: "https://example.com/cover.png",
      description: "A test book",
      genre: ["Fiction"],
      bookOwner: ownerId,
      isAvailable: true,
      ...overrides,
    });
  }
  
  const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  describe("borrow request routes (integration)", () => {
    it("POST /requests/borrow returns 401 without auth", async () => {
      const res = await request(app).post("/requests/borrow").send({});
      expect(res.status).toBe(401);
    });
  
    it("POST /requests/borrow returns 400 if returnBy is missing", async () => {
      const owner = await createUser("owner@test.com", "Owner");
      const requester = await createUser("req@test.com", "Requester");
      const book = await createBook(owner._id);
      const token = signAccessToken({ id: requester._id, role: requester.role });
  
      const res = await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookId: String(book._id), ownerId: String(owner._id) });
  
      expect(res.status).toBe(400);
    });
  
    it("POST /requests/borrow creates a pending borrow request", async () => {
      const owner = await createUser("owner2@test.com", "Owner2");
      const requester = await createUser("req2@test.com", "Requester2");
      const book = await createBook(owner._id);
      const token = signAccessToken({ id: requester._id, role: requester.role });
  
      const res = await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookId: String(book._id),
          ownerId: String(owner._id),
          returnBy: FUTURE_DATE,
        });
  
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  
    it("POST /requests/borrow/:id/accept — owner can accept", async () => {
      const owner = await createUser("owner3@test.com", "Owner3");
      const requester = await createUser("req3@test.com", "Requester3");
      const book = await createBook(owner._id);
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
      const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
  
      const createRes = await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ bookId: String(book._id), ownerId: String(owner._id), returnBy: FUTURE_DATE });
  
      const rawData = createRes.body.data;
        const requestId = Array.isArray(rawData) ? rawData[0]?._id : rawData?._id;
  
      const acceptRes = await request(app)
        .post(`/requests/borrow/${requestId}/accept`)
        .set("Authorization", `Bearer ${ownerToken}`);
  
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
    });
  
    it("POST /requests/borrow/:id/accept — requester cannot accept", async () => {
      const owner = await createUser("owner4@test.com", "Owner4");
      const requester = await createUser("req4@test.com", "Requester4");
      const book = await createBook(owner._id);
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
  
      const createRes = await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ bookId: String(book._id), ownerId: String(owner._id), returnBy: FUTURE_DATE });
  
      const rawData = createRes.body.data;
        const requestId = Array.isArray(rawData) ? rawData[0]?._id : rawData?._id;
  
      const acceptRes = await request(app)
        .post(`/requests/borrow/${requestId}/accept`)
        .set("Authorization", `Bearer ${requesterToken}`);
  
      expect(acceptRes.status).toBe(403);
    });
  
    it("POST /requests/borrow/:id/decline — owner can decline", async () => {
      const owner = await createUser("owner5@test.com", "Owner5");
      const requester = await createUser("req5@test.com", "Requester5");
      const book = await createBook(owner._id);
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
      const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
  
      const createRes = await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ bookId: String(book._id), ownerId: String(owner._id), returnBy: FUTURE_DATE });
  
      const rawData = createRes.body.data;
        const requestId = Array.isArray(rawData) ? rawData[0]?._id : rawData?._id;
  
      const declineRes = await request(app)
        .post(`/requests/borrow/${requestId}/decline`)
        .set("Authorization", `Bearer ${ownerToken}`);
  
      expect(declineRes.status).toBe(200);
      expect(declineRes.body.success).toBe(true);
    });
  
    it("POST /requests/borrow/:id/return — owner can mark returned after accepting", async () => {
      const owner = await createUser("owner6@test.com", "Owner6");
      const requester = await createUser("req6@test.com", "Requester6");
      const book = await createBook(owner._id);
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
      const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
  
      const createRes = await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ bookId: String(book._id), ownerId: String(owner._id), returnBy: FUTURE_DATE });
  
      const rawData = createRes.body.data;
        const requestId = Array.isArray(rawData) ? rawData[0]?._id : rawData?._id;
  
      await request(app)
        .post(`/requests/borrow/${requestId}/accept`)
        .set("Authorization", `Bearer ${ownerToken}`);
  
      const returnRes = await request(app)
        .post(`/requests/borrow/${requestId}/return`)
        .set("Authorization", `Bearer ${ownerToken}`);
  
      expect(returnRes.status).toBe(200);
      expect(returnRes.body.success).toBe(true);
    });
  
    it("GET /requests/me returns the user's requests", async () => {
      const owner = await createUser("owner7@test.com", "Owner7");
      const requester = await createUser("req7@test.com", "Requester7");
      const book = await createBook(owner._id);
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
  
      await request(app)
        .post("/requests/borrow")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ bookId: String(book._id), ownerId: String(owner._id), returnBy: FUTURE_DATE });
  
      const res = await request(app)
        .get("/requests/me")
        .set("Authorization", `Bearer ${requesterToken}`);
  
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
  
  describe("exchange request routes (integration)", () => {
    it("POST /requests/exchange returns 401 without auth", async () => {
      const res = await request(app).post("/requests/exchange").send({});
      expect(res.status).toBe(401);
    });
  
    it("POST /requests/exchange creates a pending exchange request", async () => {
      const owner = await createUser("exowner@test.com", "ExOwner");
      const requester = await createUser("exreq@test.com", "ExRequester");
      const targetBook = await createBook(owner._id);
      const offeredBook = await createBook(requester._id);
      const token = signAccessToken({ id: requester._id, role: requester.role });
  
      const res = await request(app)
        .post("/requests/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookId: String(targetBook._id),
          ownerId: String(owner._id),
          offeredBookId: String(offeredBook._id),
        });
  
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  
    it("POST /requests/exchange/:id/cancel — requester can cancel", async () => {
      const owner = await createUser("exowner2@test.com", "ExOwner2");
      const requester = await createUser("exreq2@test.com", "ExRequester2");
      const targetBook = await createBook(owner._id);
      const offeredBook = await createBook(requester._id);
      const token = signAccessToken({ id: requester._id, role: requester.role });
  
      const createRes = await request(app)
        .post("/requests/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookId: String(targetBook._id),
          ownerId: String(owner._id),
          offeredBookId: String(offeredBook._id),
        });
  
      const rawData = createRes.body.data;
        const requestId = Array.isArray(rawData) ? String(rawData[0]?._id) : String(rawData?._id);
  
      const cancelRes = await request(app)
        .post(`/requests/exchange/${requestId}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({ requestId });
  
      expect(cancelRes.status).toBe(200);
    });
  
    it("POST /requests/exchange/:id/decline — owner can decline", async () => {
      const owner = await createUser("exowner3@test.com", "ExOwner3");
      const requester = await createUser("exreq3@test.com", "ExRequester3");
      const targetBook = await createBook(owner._id);
      const offeredBook = await createBook(requester._id);
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
      const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
  
      const createRes = await request(app)
        .post("/requests/exchange")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({
          bookId: String(targetBook._id),
          ownerId: String(owner._id),
          offeredBookId: String(offeredBook._id),
        });
  
      const rawData = createRes.body.data;
        const requestId = Array.isArray(rawData) ? String(rawData[0]?._id) : String(rawData?._id);
  
      const declineRes = await request(app)
        .post(`/requests/exchange/${requestId}/decline`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ requestId });
  
      expect(declineRes.status).toBe(200);
    });
  
    it("GET /requests/me returns 401 without auth", async () => {
      const res = await request(app).get("/requests/me");
      expect(res.status).toBe(401);
    });
  });