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
    username: username ?? "Comment User",
    email: email ?? "comment-user@gmail.com",
    passwordHash: await bcrypt.hash("Password1!", 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
  });
}

async function createPost({ authorId, title = "Post For Comments" } = {}) {
  const { default: Post } = await import("../../../server/src/models/post.js");
  return Post.create({
    authorId,
    title,
    content: "Post body",
    genre: ["Fiction"],
    bookTag: { title: "Post Tag", author: "Post Author" },
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

describe("comment routes (integration)", () => {
  it("POST /comments creates a comment for a non-owner", async () => {
    const author = await createUser({ username: "Post Author", email: "post-author@gmail.com" });
    const commenter = await createUser({ username: "Commenter", email: "commenter@gmail.com" });
    const token = signAccessToken({ id: commenter._id, role: commenter.role });
    const post = await createPost({ authorId: author._id });

    const res = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: String(post._id), content: "Nice post!" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ content: "Nice post!" });
  });

  it("POST /comments blocks a user from commenting on their own post", async () => {
    const author = await createUser({ username: "Self Poster", email: "self-poster@gmail.com" });
    const token = signAccessToken({ id: author._id, role: author.role });
    const post = await createPost({ authorId: author._id });

    const res = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: String(post._id), content: "I should not be able to do this" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/can't comment on your own post/i);
  });

  it("GET /comments returns comments for a post", async () => {
    const author = await createUser({ username: "Browse Poster", email: "browse-poster@gmail.com" });
    const commenter = await createUser({ username: "Browse Commenter", email: "browse-commenter@gmail.com" });
    const token = signAccessToken({ id: commenter._id, role: commenter.role });
    const post = await createPost({ authorId: author._id });

    await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: String(post._id), content: "First comment" });

    const res = await request(app).get("/comments").query({ postId: String(post._id) });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe("First comment");
  });

  it("PATCH /comments/:commentId edits the author's comment", async () => {
    const author = await createUser({ username: "Edit Poster", email: "edit-poster@gmail.com" });
    const commenter = await createUser({ username: "Edit Commenter", email: "edit-commenter@gmail.com" });
    const token = signAccessToken({ id: commenter._id, role: commenter.role });
    const post = await createPost({ authorId: author._id });

    const createRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: String(post._id), content: "Original comment" });

    const res = await request(app)
      .patch(`/comments/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Edited comment" });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe("Edited comment");
  });

  it("DELETE /comments/:commentId deletes the comment and GET /comments/me shows history", async () => {
    const author = await createUser({ username: "History Poster", email: "history-poster@gmail.com" });
    const commenter = await createUser({ username: "History Commenter", email: "history-commenter@gmail.com" });
    const token = signAccessToken({ id: commenter._id, role: commenter.role });
    const post = await createPost({ authorId: author._id });

    const createRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: String(post._id), content: "History comment" });

    const historyRes = await request(app)
      .get("/comments/me")
      .set("Authorization", `Bearer ${token}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.comments).toHaveLength(1);

    const delRes = await request(app)
      .delete(`/comments/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.isRemoved).toBe(true);
  });
});
