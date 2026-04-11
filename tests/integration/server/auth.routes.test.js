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

/** Register payload: authService expects firstName, lastName, email, password, city, provinceState; profileImage comes from upload middleware (mocked). Use JSON because the mocked upload skips Multer body parsing. */
function registerPayload(overrides = {}) {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "newuser@gmail.com",
    city: "Kelowna",
    provinceState: "BC",
    password: "Valid1!Pass",
    ...overrides,
  };
}

describe("auth routes (integration)", () => {
  it("POST /auth/register valid data → 201 + user in DB", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send(registerPayload({ email: "newuser@gmail.com" }));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: "newuser@gmail.com",
      username: "Jane Doe",
    });

    const { default: User } = await import("../../../server/src/models/user.js");
    const saved = await User.findOne({ email: "newuser@gmail.com" });
    expect(saved).toBeTruthy();
  });

  it("POST /auth/register duplicate email → 400", async () => {
    const dupEmail = "dup@gmail.com";
    const first = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send(
        registerPayload({
          firstName: "First",
          lastName: "User",
          email: dupEmail,
        }),
      );

    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send(
        registerPayload({
          firstName: "Other",
          lastName: "Person",
          email: dupEmail,
        }),
      );

    expect(second.status).toBe(409);
    expect(second.body.detail).toMatch(/Email is taken/i);
  });

  it("POST /auth/register missing required fields → 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send(
        registerPayload({
          firstName: "",
          email: "missing@gmail.com",
        }),
      );

    expect(res.status).toBe(400);
    expect(res.body.detail).toBe(
      "First name, last name, email, and password are required",
    );
  });

  it("POST /auth/login correct credentials → 200 + token", async () => {
    const { default: User } = await import("../../../server/src/models/user.js");
    await User.create({
      username: "Login User",
      email: "login@gmail.com",
      passwordHash: await bcrypt.hash("Correct1!", 10),
      location: "Kelowna, BC",
      profileImage: "https://example.com/p.png",
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@gmail.com", password: "Correct1!" });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: "login@gmail.com" });
  });

  it("POST /auth/login wrong password → 401", async () => {
    const { default: User } = await import("../../../server/src/models/user.js");
    await User.create({
      username: "Wrong Pass",
      email: "wrong@gmail.com",
      passwordHash: await bcrypt.hash("Real1!", 10),
      location: "Kelowna, BC",
      profileImage: "https://example.com/p.png",
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wrong@gmail.com", password: "NotReal1!" });

    expect(res.status).toBe(401);
    expect(res.body.detail).toMatch(/Wrong email or password/i);
  });

  it("GET /auth/me no token → 401", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});
