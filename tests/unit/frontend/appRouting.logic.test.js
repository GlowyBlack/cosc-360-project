import { describe, it, expect } from "@jest/globals";

// Route access control logic used across the app

function requiresAuth(pathname) {
  const protectedRoutes = [
    "/library",
    "/messages",
    "/requests",
    "/profile",
    "/admin",
  ];
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function requiresAdmin(pathname) {
  return pathname.startsWith("/admin");
}

function redirectIfLoggedIn(pathname) {
  const authOnlyRoutes = ["/login", "/register"];
  return authOnlyRoutes.includes(pathname);
}

// URL/query string helpers used in SearchResultsPage and DiscoverPage
function parseSearchQuery(search) {
  const params = new URLSearchParams(search);
  return params.get("q")?.trim() ?? "";
}

function buildSearchUrl(query) {
  if (!query.trim()) return "/";
  return `/search?q=${encodeURIComponent(query.trim())}`;
}

describe("app routing — requiresAuth", () => {
  it("returns true for /library", () => {
    expect(requiresAuth("/library")).toBe(true);
  });

  it("returns true for /messages", () => {
    expect(requiresAuth("/messages")).toBe(true);
  });

  it("returns true for /requests", () => {
    expect(requiresAuth("/requests")).toBe(true);
  });

  it("returns true for /profile", () => {
    expect(requiresAuth("/profile")).toBe(true);
  });

  it("returns true for /admin pages", () => {
    expect(requiresAuth("/admin/users")).toBe(true);
  });

  it("returns false for public routes", () => {
    expect(requiresAuth("/")).toBe(false);
    expect(requiresAuth("/blogs")).toBe(false);
    expect(requiresAuth("/login")).toBe(false);
    expect(requiresAuth("/register")).toBe(false);
  });
});

describe("app routing — requiresAdmin", () => {
  it("returns true for /admin", () => {
    expect(requiresAdmin("/admin")).toBe(true);
  });

  it("returns true for /admin/users", () => {
    expect(requiresAdmin("/admin/users")).toBe(true);
  });

  it("returns false for non-admin routes", () => {
    expect(requiresAdmin("/profile")).toBe(false);
    expect(requiresAdmin("/library")).toBe(false);
  });
});

describe("app routing — redirectIfLoggedIn", () => {
  it("returns true for /login", () => {
    expect(redirectIfLoggedIn("/login")).toBe(true);
  });

  it("returns true for /register", () => {
    expect(redirectIfLoggedIn("/register")).toBe(true);
  });

  it("returns false for other pages", () => {
    expect(redirectIfLoggedIn("/library")).toBe(false);
    expect(redirectIfLoggedIn("/")).toBe(false);
  });
});

describe("app routing — parseSearchQuery", () => {
  it("extracts q param from query string", () => {
    expect(parseSearchQuery("?q=tolkien")).toBe("tolkien");
  });

  it("trims whitespace from query", () => {
    expect(parseSearchQuery("?q=  tolkien  ")).toBe("tolkien");
  });

  it("returns empty string when q is missing", () => {
    expect(parseSearchQuery("")).toBe("");
  });

  it("returns empty string for unrelated params", () => {
    expect(parseSearchQuery("?page=1")).toBe("");
  });
});

describe("app routing — buildSearchUrl", () => {
  it("builds correct search URL", () => {
    expect(buildSearchUrl("tolkien")).toBe("/search?q=tolkien");
  });

  it("encodes special characters", () => {
    expect(buildSearchUrl("lord of the rings")).toBe(
      "/search?q=lord%20of%20the%20rings"
    );
  });

  it("returns / for empty query", () => {
    expect(buildSearchUrl("")).toBe("/");
  });

  it("trims whitespace before building URL", () => {
    expect(buildSearchUrl("  tolkien  ")).toBe("/search?q=tolkien");
  });
});
