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

async function createUser({
  username = "Edge User",
  email = "edge-user@gmail.com",
  role = "Registered",
  isSuspended = false,
} = {}) {
  const { default: User } = await import("../../../server/src/models/user.js");
  return User.create({
    username,
    email,
    passwordHash: await bcrypt.hash("Password1!", 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
    role,
    isSuspended,
  });
}

async function createBook({ ownerId } = {}) {
  const { default: Book } = await import("../../../server/src/models/book.js");
  return Book.create({
    bookTitle: "Edge Book",
    bookAuthor: "Edge Author",
    bookImage: "https://example.com/book.png",
    description: "Edge description",
    genre: ["Fiction"],
    bookOwner: ownerId,
  });
}

async function createPost({ authorId } = {}) {
  const { default: Post } = await import("../../../server/src/models/post.js");
  return Post.create({
    authorId,
    title: "Edge Post",
    content: "Edge content",
    genre: ["Fiction"],
    bookTag: { title: "Edge Tag", author: "Edge Author" },
  });
}

async function createComment({ authorId, postId } = {}) {
  const { default: Comment } = await import("../../../server/src/models/comment.js");
  return Comment.create({
    authorId,
    postId,
    content: "Edge comment",
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

describe("edge-case routes (integration)", () => {
  it("returns 400 for invalid IDs on book, post, comment, and review routes", async () => {
    const user = await createUser();
    const token = signAccessToken({ id: user._id, role: user.role });

    const bookRes = await request(app).get("/books/not-a-real-id");
    expect(bookRes.status).toBe(400);

    const postRes = await request(app).get("/posts/not-a-real-id");
    expect(postRes.status).toBe(400);

    const commentRes = await request(app).get("/comments").query({ postId: "bad-id" });
    expect(commentRes.status).toBe(400);

    const reviewRes = await request(app)
      .get("/reviews/eligibility/not-a-real-id")
      .set("Authorization", `Bearer ${token}`);
    expect(reviewRes.status).toBe(400);
  });

  it("returns 401 for protected routes without auth", async () => {
    const createBookRes = await request(app)
      .post("/books")
      .send({
        bookTitle: "Unauthorized Book",
        bookAuthor: "Anon",
        description: "Should fail",
        genre: ["Fiction"],
      });
    expect(createBookRes.status).toBe(401);

    const postsRes = await request(app).post("/posts").send({
      title: "Unauthorized Post",
      content: "Should fail",
      genre: ["Fiction"],
    });
    expect(postsRes.status).toBe(401);

    const reportsRes = await request(app).get("/reports/me");
    expect(reportsRes.status).toBe(401);
  });

  it("returns 403 for forbidden owner-only actions", async () => {
    const owner = await createUser({ username: "Owner", email: "owner-edge@gmail.com" });
    const outsider = await createUser({ username: "Outsider", email: "outsider-edge@gmail.com" });
    const ownerToken = signAccessToken({ id: owner._id, role: owner.role });
    const outsiderToken = signAccessToken({ id: outsider._id, role: outsider.role });
    const book = await createBook({ ownerId: owner._id });
    const post = await createPost({ authorId: owner._id });

    const bookEditRes = await request(app)
      .patch(`/books/${book._id}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ bookTitle: "Not Yours" });
    expect(bookEditRes.status).toBe(403);

    const toggleRes = await request(app)
      .post(`/books/${book._id}/toggle-availability`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(toggleRes.status).toBe(403);

    const postDeleteRes = await request(app)
      .delete(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(postDeleteRes.status).toBe(403);

    const commentCreateRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ postId: String(post._id), content: "My own comment attempt" });
    expect(commentCreateRes.status).toBe(400);
    expect(commentCreateRes.body.message).toMatch(/can't comment on your own post/i);
  });

  it("returns 403 for suspended users on protected routes", async () => {
    const suspended = await createUser({
      username: "Suspended Edge",
      email: "suspended-edge@gmail.com",
      isSuspended: true,
    });
    const token = signAccessToken({ id: suspended._id, role: suspended.role });

    const res = await request(app)
      .get("/books/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });

  it("returns 400 for liking a removed comment", async () => {
    const author = await createUser({ username: "Comment Author", email: "comment-author-edge@gmail.com" });
    const commenter = await createUser({ username: "Comment Viewer", email: "comment-viewer-edge@gmail.com" });
    const token = signAccessToken({ id: commenter._id, role: commenter.role });
    const post = await createPost({ authorId: author._id });
    const comment = await createComment({ authorId: commenter._id, postId: post._id });

    const { default: Comment } = await import("../../../server/src/models/comment.js");
    await Comment.findByIdAndUpdate(comment._id, { isRemoved: true });

    const res = await request(app)
      .patch(`/comments/${comment._id}/like`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/removed comments cannot be liked/i);
  });
});
