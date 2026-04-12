import { describe, it, expect } from "@jest/globals";

// Pure functions extracted from bookShared.js — used by DiscoverPage and SearchResultsPage

function getBookRecordId(raw) {
  if (raw == null || typeof raw !== "object") return "";
  return raw._id != null ? String(raw._id) : raw.id != null ? String(raw.id) : "";
}

function getBookTitle(raw) {
  return raw.bookTitle ?? raw.title ?? "Untitled";
}

function getBookAuthor(raw) {
  return raw.bookAuthor ?? raw.author ?? "Unknown author";
}

function resolveDiscoverOwner(raw) {
  let owner = raw.owner;
  if (owner == null && raw.bookOwner != null) {
    if (typeof raw.bookOwner === "object") {
      owner = raw.bookOwner.username ?? raw.bookOwner.name ?? "Community member";
    } else {
      owner = "Community member";
    }
  }
  return owner ?? "Community member";
}

function resolveDiscoverStatus(raw) {
  return (
    raw.status ??
    (raw.isAvailable === true
      ? "Available"
      : raw.isAvailable === false
        ? "Unavailable"
        : "Available")
  );
}

function resolveBookOwnerLocation(raw) {
  if (raw.bookOwner != null && typeof raw.bookOwner === "object") {
    const loc = raw.bookOwner.location;
    if (loc != null && String(loc).trim() !== "") return String(loc).trim();
  }
  if (raw.location != null && String(raw.location).trim() !== "") {
    return String(raw.location).trim();
  }
  return null;
}

function bookGenreMatchesFilter(bookGenre, activeFilter) {
  if (activeFilter === "All") return true;
  if (bookGenre == null) return false;
  if (Array.isArray(bookGenre)) return bookGenre.includes(activeFilter);
  return String(bookGenre).includes(activeFilter);
}

function getSessionUserId(user) {
  if (user == null) return "";
  return String(user.id ?? user._id ?? "");
}

describe("discover — getBookRecordId", () => {
  it("returns _id string from object", () => {
    expect(getBookRecordId({ _id: "b1" })).toBe("b1");
  });

  it("falls back to id if no _id", () => {
    expect(getBookRecordId({ id: "b2" })).toBe("b2");
  });

  it("returns empty string for null", () => {
    expect(getBookRecordId(null)).toBe("");
  });

  it("returns empty string for non-object", () => {
    expect(getBookRecordId("string")).toBe("");
  });
});

describe("discover — getBookTitle", () => {
  it("returns bookTitle when present", () => {
    expect(getBookTitle({ bookTitle: "Dune" })).toBe("Dune");
  });

  it("falls back to title", () => {
    expect(getBookTitle({ title: "1984" })).toBe("1984");
  });

  it("returns Untitled when neither present", () => {
    expect(getBookTitle({})).toBe("Untitled");
  });
});

describe("discover — getBookAuthor", () => {
  it("returns bookAuthor when present", () => {
    expect(getBookAuthor({ bookAuthor: "Frank Herbert" })).toBe("Frank Herbert");
  });

  it("falls back to author", () => {
    expect(getBookAuthor({ author: "Orwell" })).toBe("Orwell");
  });

  it("returns Unknown author when neither present", () => {
    expect(getBookAuthor({})).toBe("Unknown author");
  });
});

describe("discover — resolveDiscoverOwner", () => {
  it("uses owner field when present", () => {
    expect(resolveDiscoverOwner({ owner: "Alice" })).toBe("Alice");
  });

  it("uses bookOwner.username when owner is missing", () => {
    expect(resolveDiscoverOwner({ bookOwner: { username: "Bob" } })).toBe("Bob");
  });

  it("falls back to Community member", () => {
    expect(resolveDiscoverOwner({})).toBe("Community member");
  });
});

describe("discover — resolveDiscoverStatus", () => {
  it("returns status field when present", () => {
    expect(resolveDiscoverStatus({ status: "Borrowed" })).toBe("Borrowed");
  });

  it("returns Available when isAvailable is true", () => {
    expect(resolveDiscoverStatus({ isAvailable: true })).toBe("Available");
  });

  it("returns Unavailable when isAvailable is false", () => {
    expect(resolveDiscoverStatus({ isAvailable: false })).toBe("Unavailable");
  });

  it("defaults to Available when isAvailable is undefined", () => {
    expect(resolveDiscoverStatus({})).toBe("Available");
  });
});

describe("discover — resolveBookOwnerLocation", () => {
  it("returns location from bookOwner object", () => {
    expect(resolveBookOwnerLocation({ bookOwner: { location: "Kelowna" } })).toBe("Kelowna");
  });

  it("falls back to top-level location", () => {
    expect(resolveBookOwnerLocation({ location: "Vancouver" })).toBe("Vancouver");
  });

  it("returns null when no location is present", () => {
    expect(resolveBookOwnerLocation({})).toBeNull();
  });
});

describe("discover — bookGenreMatchesFilter", () => {
  it("returns true for All filter", () => {
    expect(bookGenreMatchesFilter(["Fantasy"], "All")).toBe(true);
  });

  it("returns true when genre array includes filter", () => {
    expect(bookGenreMatchesFilter(["Fantasy", "Fiction"], "Fantasy")).toBe(true);
  });

  it("returns false when genre array does not include filter", () => {
    expect(bookGenreMatchesFilter(["Fiction"], "Horror")).toBe(false);
  });

  it("returns false when genre is null", () => {
    expect(bookGenreMatchesFilter(null, "Fantasy")).toBe(false);
  });
});

describe("auth — getSessionUserId", () => {
  it("returns id from user.id", () => {
    expect(getSessionUserId({ id: "u1" })).toBe("u1");
  });

  it("returns _id from user._id", () => {
    expect(getSessionUserId({ _id: "u2" })).toBe("u2");
  });

  it("returns empty string for null user", () => {
    expect(getSessionUserId(null)).toBe("");
  });

  it("prefers id over _id", () => {
    expect(getSessionUserId({ id: "u1", _id: "u2" })).toBe("u1");
  });
});
