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
  import { MongoMemoryServer } from "mongodb-memory-server";
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
    mongoServer = await MongoMemoryServer.create();
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
    });
  }
  
  async function createBorrowRequest(bookId, ownerId, requesterId) {
    const { default: Request } = await import("../../../server/src/models/request.js");
    return Request.create({
      bookId,
      bookOwner: ownerId,
      requesterId,
      type: "Borrow",
      returnBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "Pending",
    });
  }
  
  async function createBook(ownerId) {
    const { default: Book } = await import("../../../server/src/models/book.js");
    return Book.create({
      bookTitle: "Test Book",
      bookAuthor: "Test Author",
      bookImage: "https://example.com/cover.png",
      description: "A test book",
      genre: ["Fiction"],
      bookOwner: ownerId,
    });
  }
  
  describe("message routes (integration)", () => {
    it("GET /messages/inbox returns 401 without auth", async () => {
      const res = await request(app).get("/messages/inbox");
      expect(res.status).toBe(401);
    });
  
    it("GET /messages/inbox returns empty threads for new user", async () => {
      const user = await createUser("inbox@test.com", "InboxUser");
      const token = signAccessToken({ id: user._id, role: user.role });
  
      const res = await request(app)
        .get("/messages/inbox")
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.status).toBe(200);
      expect(res.body.threads).toBeDefined();
      expect(Array.isArray(res.body.threads)).toBe(true);
      expect(res.body.threads).toHaveLength(0);
    });
  
    it("POST /messages returns 401 without auth", async () => {
      const res = await request(app)
        .post("/messages")
        .send({ requestId: "507f1f77bcf86cd799439011", content: "Hello" });
      expect(res.status).toBe(401);
    });
  
    it("POST /messages returns 400 if content is empty", async () => {
      const owner = await createUser("owner@test.com", "OwnerUser");
      const requester = await createUser("requester@test.com", "RequesterUser");
      const book = await createBook(owner._id);
      const req = await createBorrowRequest(book._id, owner._id, requester._id);
      const token = signAccessToken({ id: owner._id, role: owner.role });
  
      const res = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ requestId: String(req._id), content: "" });
  
      expect(res.status).toBe(400);
    });
  
    it("POST /messages sends a message and GET /:requestId retrieves it", async () => {
      const owner = await createUser("owner2@test.com", "Owner2");
      const requester = await createUser("requester2@test.com", "Requester2");
      const book = await createBook(owner._id);
      const req = await createBorrowRequest(book._id, owner._id, requester._id);
  
      const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
  
      const sendRes = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ requestId: String(req._id), content: "Hello there!" });
  
      expect(sendRes.status).toBe(201);
      expect(sendRes.body.content).toBe("Hello there!");
  
      const getRes = await request(app)
        .get(`/messages/${String(req._id)}`)
        .set("Authorization", `Bearer ${requesterToken}`);
  
      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body)).toBe(true);
      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].content).toBe("Hello there!");
    });
  
    it("GET /messages/:requestId returns 403 for non-participant", async () => {
      const owner = await createUser("owner3@test.com", "Owner3");
      const requester = await createUser("requester3@test.com", "Requester3");
      const outsider = await createUser("outsider@test.com", "Outsider");
      const book = await createBook(owner._id);
      const req = await createBorrowRequest(book._id, owner._id, requester._id);
      const outsiderToken = signAccessToken({ id: outsider._id, role: outsider.role });
  
      const res = await request(app)
        .get(`/messages/${String(req._id)}`)
        .set("Authorization", `Bearer ${outsiderToken}`);
  
      expect(res.status).toBe(403);
    });
  
    it("PATCH /messages/:requestId/read marks messages as read", async () => {
      const owner = await createUser("owner4@test.com", "Owner4");
      const requester = await createUser("requester4@test.com", "Requester4");
      const book = await createBook(owner._id);
      const req = await createBorrowRequest(book._id, owner._id, requester._id);
  
      const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
      const requesterToken = signAccessToken({ id: requester._id, role: requester.role });
  
      await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ requestId: String(req._id), content: "Unread message" });
  
      const patchRes = await request(app)
        .patch(`/messages/${String(req._id)}/read`)
        .set("Authorization", `Bearer ${requesterToken}`);
  
      expect(patchRes.status).toBe(200);
    });
  });