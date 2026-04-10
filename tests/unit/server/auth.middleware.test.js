import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";
import jwt from "jsonwebtoken";

const lean = jest.fn();
const findById = jest.fn();

jest.unstable_mockModule("../../../server/src/models/user.js", () => ({
  default: {
    findById: (...args) => findById(...args),
  },
}));

let requireAuth;

beforeAll(async () => {
  process.env.JWT_SECRET = "dev-secret-change-me";
  const mod = await import("../../../server/src/middleware/auth.js");
  requireAuth = mod.requireAuth;
});

beforeEach(() => {
  lean.mockReset();
  findById.mockImplementation(() => ({
    select: jest.fn().mockReturnValue({ lean }),
  }));
});

function userDoc(overrides = {}) {
  return {
    _id: "507f1f77bcf86cd799439011",
    role: "Registered",
    isBanned: false,
    isSuspended: false,
    email: "u@gmail.com",
    username: "Test User",
    ...overrides,
  };
}

describe("requireAuth", () => {
  it("401 when no Authorization header", async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 when token is not a valid JWT", async () => {
    const req = { headers: { authorization: "Bearer not-a-jwt" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and sets req.user when token valid and user active", async () => {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      "dev-secret-change-me"
    );
    lean.mockResolvedValueOnce(userDoc());
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    const next = jest.fn();
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({
      role: "Registered",
      email: "u@gmail.com",
    });
    expect(res.setHeader).toHaveBeenCalledWith(
      "X-Renewed-Token",
      expect.any(String)
    );
  });

  it("403 when user is banned", async () => {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      "dev-secret-change-me"
    );
    lean.mockResolvedValueOnce(userDoc({ isBanned: true }));
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 when user is suspended", async () => {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      "dev-secret-change-me"
    );
    lean.mockResolvedValueOnce(userDoc({ isSuspended: true }));
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
