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
    username: username ?? "Admin User",
    email: email ?? "admin-user@gmail.com",
    passwordHash: await bcrypt.hash("Password1!", 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
    role,
  });
}

async function createPost({ authorId, title = "Admin Post" } = {}) {
  const { default: Post } = await import("../../../server/src/models/post.js");
  return Post.create({
    authorId,
    title,
    content: "Admin post content",
    genre: ["Fiction"],
    bookTag: { title: "Tagged", author: "Author" },
  });
}

async function createComment({ authorId, postId, content = "Admin comment" } = {}) {
  const { default: Comment } = await import("../../../server/src/models/comment.js");
  return Comment.create({ authorId, postId, content });
}

async function createReport({ reporterId, targetType, targetId, status = "Open" } = {}) {
  const { default: Report } = await import("../../../server/src/models/report.js");
  return Report.create({
    reporterId,
    targetType,
    targetId,
    reason: "Needs moderation",
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

describe("admin routes (integration)", () => {
  it("blocks non-admin users from admin routes", async () => {
    const user = await createUser({ username: "Regular User", email: "regular@gmail.com" });
    const token = signAccessToken({ id: user._id, role: user.role });

    const res = await request(app)
      .get("/admin/posts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/i);
  });

  it("admin can remove and restore a post", async () => {
    const admin = await createUser({ username: "Admin", email: "admin@gmail.com", role: "Admin" });
    const author = await createUser({ username: "Post Author", email: "post-author-admin@gmail.com" });
    const token = signAccessToken({ id: admin._id, role: admin.role });
    const post = await createPost({ authorId: author._id });

    const removeRes = await request(app)
      .put(`/admin/posts/${post._id}/remove`)
      .set("Authorization", `Bearer ${token}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.isRemoved).toBe(true);

    const restoreRes = await request(app)
      .put(`/admin/posts/${post._id}/restore`)
      .set("Authorization", `Bearer ${token}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.isRemoved).toBe(false);
  });

  it("admin can remove and restore a comment", async () => {
    const admin = await createUser({ username: "Admin Two", email: "admin2@gmail.com", role: "Admin" });
    const author = await createUser({ username: "Comment Author", email: "comment-author@gmail.com" });
    const commenter = await createUser({ username: "Comment User", email: "comment-user-admin@gmail.com" });
    const token = signAccessToken({ id: admin._id, role: admin.role });
    const post = await createPost({ authorId: author._id });
    const comment = await createComment({ authorId: commenter._id, postId: post._id });

    const removeRes = await request(app)
      .put(`/admin/comments/${comment._id}/remove`)
      .set("Authorization", `Bearer ${token}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.isRemoved).toBe(true);

    const restoreRes = await request(app)
      .put(`/admin/comments/${comment._id}/restore`)
      .set("Authorization", `Bearer ${token}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.isRemoved).toBe(false);
  });

  it("admin can list and update reports", async () => {
    const admin = await createUser({ username: "Admin Three", email: "admin3@gmail.com", role: "Admin" });
    const author = await createUser({ username: "Reported User", email: "reported-user@gmail.com" });
    const reporter = await createUser({ username: "Reporter User", email: "reporter-user@gmail.com" });
    const token = signAccessToken({ id: admin._id, role: admin.role });
    const post = await createPost({ authorId: author._id });
    const report = await createReport({
      reporterId: reporter._id,
      targetType: "Post",
      targetId: post._id,
    });

    const listRes = await request(app)
      .get("/admin/reports")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(1);

    const patchRes = await request(app)
      .patch(`/admin/reports/${report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Dismissed" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe("Dismissed");

    const resolveRes = await request(app)
      .put(`/admin/reports/${report._id}/resolve`)
      .set("Authorization", `Bearer ${token}`);
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe("Reviewed");

    const unresolveRes = await request(app)
      .put(`/admin/reports/${report._id}/unresolve`)
      .set("Authorization", `Bearer ${token}`);
    expect(unresolveRes.status).toBe(200);
    expect(unresolveRes.body.status).toBe("Open");
  });

  it("admin can suspend and ban users", async () => {
    const admin = await createUser({ username: "Admin Four", email: "admin4@gmail.com", role: "Admin" });
    const target = await createUser({ username: "Target User", email: "target-user@gmail.com" });
    const token = signAccessToken({ id: admin._id, role: admin.role });

    const suspendRes = await request(app)
      .put(`/admin/users/${target._id}/suspend`)
      .set("Authorization", `Bearer ${token}`);
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.isSuspended).toBe(true);

    const unsuspendRes = await request(app)
      .put(`/admin/users/${target._id}/unsuspend`)
      .set("Authorization", `Bearer ${token}`);
    expect(unsuspendRes.status).toBe(200);
    expect(unsuspendRes.body.isSuspended).toBe(false);

    const banRes = await request(app)
      .put(`/admin/users/${target._id}/ban`)
      .set("Authorization", `Bearer ${token}`);
    expect(banRes.status).toBe(200);
    expect(banRes.body.isBanned).toBe(true);

    const unbanRes = await request(app)
      .put(`/admin/users/${target._id}/unban`)
      .set("Authorization", `Bearer ${token}`);
    expect(unbanRes.status).toBe(200);
    expect(unbanRes.body.isBanned).toBe(false);
  });
});
