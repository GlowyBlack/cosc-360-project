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
  username = "Poster One",
  email = "poster1@gmail.com",
  password = "Password1!",
  role = "Registered",
} = {}) {
  const { default: User } = await import("../../../server/src/models/user.js");
  return User.create({
    username,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    location: "Kelowna, BC",
    profileImage: "https://example.com/avatar.png",
    role,
  });
}

async function createPost({
  authorId,
  title = "Original Post",
  content = "Original content",
  genre = ["Fiction"],
  bookTag = { title: "Tagged Book", author: "Tagged Author" },
} = {}) {
  const { default: Post } = await import("../../../server/src/models/post.js");
  return Post.create({ authorId, title, content, genre, bookTag });
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

describe("post routes (integration)", () => {
  it("POST /posts creates a post for an authenticated user", async () => {
    const author = await createUser({ username: "Author One", email: "author1@gmail.com" });
    const token = signAccessToken({ id: author._id, role: author.role });

    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Books I Love",
        content: "A list of favorite books.",
        genre: ["Fantasy"],
        bookTag: { title: "The Hobbit", author: "J.R.R. Tolkien" },
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Books I Love",
      content: "A list of favorite books.",
      genre: ["Fantasy"],
      bookTag: { title: "The Hobbit", author: "J.R.R. Tolkien" },
    });
  });

  it("GET /posts returns browsable posts and supports text search", async () => {
    const author = await createUser({ username: "Search Author", email: "search-author@gmail.com" });
    await createPost({
      authorId: author._id,
      title: "Fantasy Shelf",
      content: "Talk about fantasy",
      genre: ["Fantasy"],
    });
    await createPost({
      authorId: author._id,
      title: "Mystery Shelf",
      content: "Talk about mystery",
      genre: ["Mystery"],
    });

    const allRes = await request(app).get("/posts");
    expect(allRes.status).toBe(200);
    expect(allRes.body).toHaveLength(2);

    const searchRes = await request(app).get("/posts").query({ q: "Fantasy" });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body).toHaveLength(1);
    expect(searchRes.body[0].title).toBe("Fantasy Shelf");
  });

  it("PATCH /posts/:postId lets the owner edit the post", async () => {
    const author = await createUser({ username: "Editor", email: "editor@gmail.com" });
    const token = signAccessToken({ id: author._id, role: author.role });
    const post = await createPost({ authorId: author._id });

    const res = await request(app)
      .patch(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Post",
        content: "Updated content",
        genre: ["Sci-Fi"],
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: "Updated Post",
      content: "Updated content",
      genre: ["Sci-Fi"],
    });
  });

  it("PATCH /posts/:postId/like and /dislike update reactions", async () => {
    const author = await createUser({ username: "Reaction Author", email: "reaction-author@gmail.com" });
    const viewer = await createUser({ username: "Reaction Viewer", email: "reaction-viewer@gmail.com" });
    const token = signAccessToken({ id: viewer._id, role: viewer.role });
    const post = await createPost({ authorId: author._id });

    const likeRes = await request(app)
      .patch(`/posts/${post._id}/like`)
      .set("Authorization", `Bearer ${token}`);
    expect(likeRes.status).toBe(200);
    expect(likeRes.body.likeCount).toBe(1);
    expect(likeRes.body.dislikeCount).toBe(0);

    const dislikeRes = await request(app)
      .patch(`/posts/${post._id}/dislike`)
      .set("Authorization", `Bearer ${token}`);
    expect(dislikeRes.status).toBe(200);
    expect(dislikeRes.body.likeCount).toBe(0);
    expect(dislikeRes.body.dislikeCount).toBe(1);
  });

  it("DELETE /posts/:postId soft-deletes the owner's post", async () => {
    const author = await createUser({ username: "Delete Author", email: "delete-author@gmail.com" });
    const token = signAccessToken({ id: author._id, role: author.role });
    const post = await createPost({ authorId: author._id, title: "Delete This" });

    const delRes = await request(app)
      .delete(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const getRes = await request(app).get(`/posts/${post._id}`);
    expect(getRes.status).toBe(404);
  });
});
