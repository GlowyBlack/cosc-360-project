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

async function createUser({ username, email, role = "Registered" } = {}) {
  const { default: User } = await import("../../../server/src/models/user.js");
  return User.create({
    username: username ?? "Report User",
    email: email ?? "report-user@gmail.com",
    passwordHash: await bcrypt.hash("Password1!", 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
    role,
  });
}

async function createPost({ authorId, title = "Reported Post" } = {}) {
  const { default: Post } = await import("../../../server/src/models/post.js");
  return Post.create({
    authorId,
    title,
    content: "Reportable content",
    genre: ["Fiction"],
    bookTag: { title: "Tagged", author: "Author" },
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

describe("report routes (integration)", () => {
  it("POST /reports creates a report for a valid target", async () => {
    const author = await createUser({ username: "Reported Author", email: "reported-author@gmail.com" });
    const reporter = await createUser({ username: "Reporter", email: "reporter@gmail.com" });
    const post = await createPost({ authorId: author._id });
    const token = signAccessToken({ id: reporter._id, role: reporter.role });

    const res = await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetType: "Post",
        targetId: String(post._id),
        reason: "Spam content",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      targetType: "Post",
      targetId: String(post._id),
      status: "Open",
    });
  });

  it("POST /reports prevents duplicate open reports for the same target", async () => {
    const author = await createUser({ username: "Dup Author", email: "dup-author@gmail.com" });
    const reporter = await createUser({ username: "Dup Reporter", email: "dup-reporter@gmail.com" });
    const post = await createPost({ authorId: author._id });
    const token = signAccessToken({ id: reporter._id, role: reporter.role });

    await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetType: "Post",
        targetId: String(post._id),
        reason: "First report",
      });

    const res = await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetType: "Post",
        targetId: String(post._id),
        reason: "Second report",
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already have an open report/i);
  });

  it("GET /reports/me lists the current user's reports", async () => {
    const author = await createUser({ username: "Mine Author", email: "mine-author@gmail.com" });
    const reporter = await createUser({ username: "Mine Reporter", email: "mine-reporter@gmail.com" });
    const post = await createPost({ authorId: author._id });
    const token = signAccessToken({ id: reporter._id, role: reporter.role });

    await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetType: "Post",
        targetId: String(post._id),
        reason: "Needs review",
      });

    const res = await request(app)
      .get("/reports/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
  });
});
