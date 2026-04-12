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
  default: (req, _res, next) => {
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

async function createUser({ username, email } = {}) {
  const { default: User } = await import("../../../server/src/models/user.js");
  return User.create({
    username: username ?? "Review User",
    email: email ?? "review-user@gmail.com",
    passwordHash: await bcrypt.hash("Password1!", 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
  });
}

async function createBook({ ownerId, title = "Reviewable Book" } = {}) {
  const { default: Book } = await import("../../../server/src/models/book.js");
  return Book.create({
    bookTitle: title,
    bookAuthor: "Review Author",
    bookImage: "https://example.com/book.png",
    description: "Book for reviews",
    genre: ["Fiction"],
    bookOwner: ownerId,
  });
}

async function createBorrowRequest({
  bookId,
  ownerId,
  requesterId,
  status = "Returned",
} = {}) {
  const { default: Request } = await import("../../../server/src/models/request.js");
  return Request.create({
    bookId,
    bookOwner: ownerId,
    requesterId,
    type: "Borrow",
    returnBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status,
  });
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

describe("review routes (integration)", () => {
  it("GET /reviews/eligibility/:requestId shows a completed borrow is reviewable", async () => {
    const owner = await createUser({ username: "Review Owner", email: "review-owner@gmail.com" });
    const requester = await createUser({ username: "Review Requester", email: "review-requester@gmail.com" });
    const book = await createBook({ ownerId: owner._id });
    const reqDoc = await createBorrowRequest({
      bookId: book._id,
      ownerId: owner._id,
      requesterId: requester._id,
      status: "Returned",
    });
    const token = signAccessToken({ id: requester._id, role: requester.role });

    const res = await request(app)
      .get(`/reviews/eligibility/${reqDoc._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.eligible).toBe(true);
    expect(String(res.body.revieweeId)).toBe(String(owner._id));
  });

  it("POST /reviews creates a review for a completed request", async () => {
    const owner = await createUser({ username: "Create Owner", email: "create-owner@gmail.com" });
    const requester = await createUser({ username: "Create Requester", email: "create-requester@gmail.com" });
    const book = await createBook({ ownerId: owner._id });
    const reqDoc = await createBorrowRequest({
      bookId: book._id,
      ownerId: owner._id,
      requesterId: requester._id,
      status: "Returned",
    });
    const token = signAccessToken({ id: requester._id, role: requester.role });

    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestId: String(reqDoc._id),
        rating: 5,
        comment: "Great experience",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      requestId: String(reqDoc._id),
      rating: 5,
      comment: "Great experience",
    });
  });

  it("GET /reviews/request/:requestId and /reviews/user/:userId return saved reviews", async () => {
    const owner = await createUser({ username: "List Owner", email: "list-owner@gmail.com" });
    const requester = await createUser({ username: "List Requester", email: "list-requester@gmail.com" });
    const book = await createBook({ ownerId: owner._id });
    const reqDoc = await createBorrowRequest({
      bookId: book._id,
      ownerId: owner._id,
      requesterId: requester._id,
      status: "Returned",
    });
    const token = signAccessToken({ id: requester._id, role: requester.role });

    await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestId: String(reqDoc._id),
        rating: 4,
        comment: "Solid trade",
      });

    const byRequestRes = await request(app).get(`/reviews/request/${reqDoc._id}`);
    expect(byRequestRes.status).toBe(200);
    expect(byRequestRes.body).toHaveLength(1);

    const byUserRes = await request(app).get(`/reviews/user/${owner._id}`);
    expect(byUserRes.status).toBe(200);
    expect(byUserRes.body).toHaveLength(1);
    expect(byUserRes.body[0].rating).toBe(4);
  });
});
