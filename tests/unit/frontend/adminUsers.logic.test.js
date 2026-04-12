import { describe, it, expect } from "@jest/globals";

// Pure functions extracted from AdminUsersPage.jsx

function bookCountMap(books) {
  const m = new Map();
  if (!Array.isArray(books)) return m;
  for (const b of books) {
    const raw = b?.bookOwner;
    const id =
      raw && typeof raw === "object" && raw._id != null
        ? String(raw._id)
        : raw != null
          ? String(raw)
          : "";
    if (!id) continue;
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}

// Pure routing logic: admin-only access check
function isAdminUser(user) {
  return user?.role === "Admin";
}

// Search filter logic used in AdminUsersPage
function userMatchesSearch(user, query) {
  const q = String(query ?? "").toLowerCase().trim();
  if (!q) return true;
  return (
    String(user.username ?? "").toLowerCase().includes(q) ||
    String(user.email ?? "").toLowerCase().includes(q)
  );
}

describe("admin — bookCountMap", () => {
  it("returns empty map for empty array", () => {
    expect(bookCountMap([])).toEqual(new Map());
  });

  it("returns empty map for non-array input", () => {
    expect(bookCountMap(null)).toEqual(new Map());
    expect(bookCountMap("bad")).toEqual(new Map());
  });

  it("counts books per owner using object _id", () => {
    const books = [
      { bookOwner: { _id: "u1" } },
      { bookOwner: { _id: "u1" } },
      { bookOwner: { _id: "u2" } },
    ];
    const result = bookCountMap(books);
    expect(result.get("u1")).toBe(2);
    expect(result.get("u2")).toBe(1);
  });

  it("counts books per owner using plain string id", () => {
    const books = [
      { bookOwner: "u3" },
      { bookOwner: "u3" },
    ];
    const result = bookCountMap(books);
    expect(result.get("u3")).toBe(2);
  });

  it("skips entries with no bookOwner", () => {
    const books = [{ bookOwner: null }, { bookOwner: undefined }];
    expect(bookCountMap(books).size).toBe(0);
  });
});

describe("admin — isAdminUser", () => {
  it("returns true for Admin role", () => {
    expect(isAdminUser({ role: "Admin" })).toBe(true);
  });

  it("returns false for Registered role", () => {
    expect(isAdminUser({ role: "Registered" })).toBe(false);
  });

  it("returns false for null user", () => {
    expect(isAdminUser(null)).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(isAdminUser(undefined)).toBe(false);
  });
});

describe("admin — userMatchesSearch", () => {
  const user = { username: "JohnDoe", email: "john@test.com" };

  it("returns true for empty query", () => {
    expect(userMatchesSearch(user, "")).toBe(true);
  });

  it("matches by username case-insensitively", () => {
    expect(userMatchesSearch(user, "john")).toBe(true);
    expect(userMatchesSearch(user, "JOHN")).toBe(true);
  });

  it("matches by email", () => {
    expect(userMatchesSearch(user, "john@test")).toBe(true);
  });

  it("returns false for non-matching query", () => {
    expect(userMatchesSearch(user, "alice")).toBe(false);
  });

  it("returns false when username and email are missing", () => {
    expect(userMatchesSearch({}, "john")).toBe(false);
  });
});
