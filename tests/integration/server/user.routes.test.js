import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import bcrypt from "bcryptjs";
import { signAccessToken } from "../../../server/src/middleware/auth.js";

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

describe("user routes (integration)", () => {
  it("GET /user/wishlist returns the authenticated user's populated wishlist", async () => {
    const { default: User } = await import("../../../server/src/models/user.js");
    const { default: Book } = await import("../../../server/src/models/book.js");

    const owner = await User.create({
      username: "Owner User",
      email: "owner@gmail.com",
      passwordHash: await bcrypt.hash("Owner1!", 10),
      location: "Kelowna, BC",
      profileImage: "https://example.com/owner.png",
    });

    const viewer = await User.create({
      username: "Viewer User",
      email: "viewer@gmail.com",
      passwordHash: await bcrypt.hash("Viewer1!", 10),
      location: "Vancouver, BC",
      profileImage: "https://example.com/viewer.png",
    });

    const firstBook = await Book.create({
      bookTitle: "Book One",
      bookAuthor: "Author One",
      bookImage: "https://example.com/book-1.png",
      description: "First description",
      genre: ["Fantasy"],
      bookOwner: owner._id,
    });

    const secondBook = await Book.create({
      bookTitle: "Book Two",
      bookAuthor: "Author Two",
      bookImage: "https://example.com/book-2.png",
      description: "Second description",
      genre: ["Drama"],
      bookOwner: owner._id,
    });

    viewer.wishlist = [firstBook._id, secondBook._id];
    await viewer.save();

    const token = signAccessToken({ id: viewer._id, role: viewer.role });

    const res = await request(app)
      .get("/user/wishlist")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((book) => book.bookTitle)).toEqual(["Book Two", "Book One"]);
    expect(res.body[0].bookOwner).toMatchObject({
      username: "Owner User",
      location: "Kelowna, BC",
      profileImage: "https://example.com/owner.png",
    });
  });

  it("GET /user/wishlist without auth returns 401", async () => {
    const res = await request(app).get("/user/wishlist");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authenticated");
  });
});
