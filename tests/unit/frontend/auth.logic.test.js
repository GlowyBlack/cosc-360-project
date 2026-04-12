import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Pure functions extracted from AuthContext.jsx
// Note: localStorage is mocked here since tests run in Node (not browser)

const STORAGE_KEY = "bookbuddy:user";

const store = {};
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

global.localStorage = localStorageMock;

function tokenPresentInStorage() {
  const raw = String(localStorage.getItem("token") ?? "");
  const unquoted = raw.replace(/^"|"$/g, "");
  const token = unquoted.startsWith("Bearer ")
    ? unquoted.slice("Bearer ".length)
    : unquoted;
  return Boolean(String(token).trim());
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("auth session — tokenPresentInStorage", () => {
  it("returns false when no token is stored", () => {
    expect(tokenPresentInStorage()).toBe(false);
  });

  it("returns true when a plain token is stored", () => {
    localStorage.setItem("token", "abc123");
    expect(tokenPresentInStorage()).toBe(true);
  });

  it("returns true when a Bearer-prefixed token is stored", () => {
    localStorage.setItem("token", "Bearer abc123");
    expect(tokenPresentInStorage()).toBe(true);
  });

  it("returns true when token is stored with surrounding quotes", () => {
    localStorage.setItem("token", '"abc123"');
    expect(tokenPresentInStorage()).toBe(true);
  });

  it("returns false when token is an empty string", () => {
    localStorage.setItem("token", "");
    expect(tokenPresentInStorage()).toBe(false);
  });

  it("returns false when token is only whitespace", () => {
    localStorage.setItem("token", "   ");
    expect(tokenPresentInStorage()).toBe(false);
  });

  it("returns false when token is Bearer with no value", () => {
    localStorage.setItem("token", "Bearer ");
    expect(tokenPresentInStorage()).toBe(false);
  });
});

describe("auth session — readStoredUser", () => {
  it("returns null when nothing is stored", () => {
    expect(readStoredUser()).toBeNull();
  });

  it("returns parsed user object when valid JSON is stored", () => {
    const user = { _id: "u1", email: "a@test.com" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    expect(readStoredUser()).toEqual(user);
  });

  it("returns null and clears storage when JSON is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(readStoredUser()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null when stored value is null string", () => {
    localStorage.setItem(STORAGE_KEY, "null");
    expect(readStoredUser()).toBeNull();
  });
});
