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
    username: username ?? "Follow User",
    email: email ?? "follow-user@gmail.com",
    passwordHash: await bcrypt.hash("Password1!", 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
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

describe("follow routes (integration)", () => {
  it("POST /user/:id/follow follows another user", async () => {
    const viewer = await createUser({ username: "Viewer", email: "viewer@gmail.com" });
    const target = await createUser({ username: "Target", email: "target@gmail.com" });
    const token = signAccessToken({ id: viewer._id, role: viewer.role });

    const res = await request(app)
      .post(`/user/${target._id}/follow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("GET follow endpoints return follow status, stats, and lists", async () => {
    const viewer = await createUser({ username: "Viewer Two", email: "viewer2@gmail.com" });
    const target = await createUser({ username: "Target Two", email: "target2@gmail.com" });
    const token = signAccessToken({ id: viewer._id, role: viewer.role });

    await request(app)
      .post(`/user/${target._id}/follow`)
      .set("Authorization", `Bearer ${token}`);

    const isFollowingRes = await request(app)
      .get(`/user/${target._id}/is-following`)
      .set("Authorization", `Bearer ${token}`);
    expect(isFollowingRes.status).toBe(200);
    expect(isFollowingRes.body.data.isFollowing).toBe(true);

    const statsRes = await request(app).get(`/user/${target._id}/follow-stats`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.followersCount).toBe(1);

    const myFollowingRes = await request(app)
      .get("/user/me/following")
      .set("Authorization", `Bearer ${token}`);
    expect(myFollowingRes.status).toBe(200);
    expect(myFollowingRes.body.data).toHaveLength(1);

    const followersRes = await request(app)
      .get(`/user/${target._id}/followers`)
      .set("Authorization", `Bearer ${token}`);
    expect(followersRes.status).toBe(200);
    expect(followersRes.body.data).toHaveLength(1);
  });

  it("DELETE /user/:id/follow unfollows the user", async () => {
    const viewer = await createUser({ username: "Viewer Three", email: "viewer3@gmail.com" });
    const target = await createUser({ username: "Target Three", email: "target3@gmail.com" });
    const token = signAccessToken({ id: viewer._id, role: viewer.role });

    await request(app)
      .post(`/user/${target._id}/follow`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .delete(`/user/${target._id}/follow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const isFollowingRes = await request(app)
      .get(`/user/${target._id}/is-following`)
      .set("Authorization", `Bearer ${token}`);
    expect(isFollowingRes.body.data.isFollowing).toBe(false);
  });
});
