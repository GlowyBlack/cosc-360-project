import { describe, it, expect } from "@jest/globals";

// Pure functions extracted from MessagesPage.jsx

function idString(ref) {
  if (ref == null) return "";
  if (typeof ref === "object") return String(ref._id ?? ref.id ?? "");
  return String(ref);
}

function formatRelative(value) {
  const stamp = new Date(value).getTime();
  if (!Number.isFinite(stamp)) return "";
  const diff = Date.now() - stamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function requestInboxTab(request) {
  const status = String(request?.status ?? "").toLowerCase();
  const type = String(request?.type ?? "").toLowerCase();
  if (status === "cancelled") return null;
  if (status === "pending") return "ongoing";
  if (status === "declined" || status === "returned") return "archived";
  if (status === "accepted") {
    if (type === "borrow") return "ongoing";
    return "archived";
  }
  return "ongoing";
}

function requestAllowsSending(request) {
  const status = String(request?.status ?? "").toLowerCase();
  const type = String(request?.type ?? "").toLowerCase();
  if (status === "cancelled") return false;
  if (status === "pending") return true;
  if (status === "declined" || status === "returned") return false;
  if (status === "accepted") {
    if (type === "borrow") return true;
    return false;
  }
  return false;
}

function threadFromRequest(request, sessionUserId) {
  const requestId = idString(request._id ?? request.id);
  const ownerId = idString(request.bookOwner);
  const requesterId = idString(request.requesterId);
  const isOwner = ownerId === sessionUserId;
  const otherUser = isOwner ? request.requesterId : request.bookOwner;
  const otherUsername = otherUser?.username ? String(otherUser.username) : "reader";
  const partnerId = isOwner ? requesterId : ownerId;
  return {
    requestId,
    title: request.bookId?.bookTitle ?? "Untitled",
    partnerName: `@${otherUsername.replace(/^@/, "")}`,
    status: String(request.status ?? "Pending"),
    partnerId,
  };
}

describe("messages — idString", () => {
  it("returns empty string for null", () => {
    expect(idString(null)).toBe("");
  });

  it("returns _id from object", () => {
    expect(idString({ _id: "abc" })).toBe("abc");
  });

  it("falls back to id if no _id", () => {
    expect(idString({ id: "xyz" })).toBe("xyz");
  });

  it("returns string version of a plain string", () => {
    expect(idString("hello")).toBe("hello");
  });
});

describe("messages — formatRelative", () => {
  it("returns Now for very recent timestamps", () => {
    expect(formatRelative(Date.now() - 30000)).toBe("Now");
  });

  it("returns minutes for timestamps less than an hour ago", () => {
    const result = formatRelative(Date.now() - 10 * 60000);
    expect(result).toBe("10m");
  });

  it("returns hours for timestamps less than a day ago", () => {
    const result = formatRelative(Date.now() - 3 * 3600000);
    expect(result).toBe("3h");
  });

  it("returns days for older timestamps", () => {
    const result = formatRelative(Date.now() - 2 * 86400000);
    expect(result).toBe("2d");
  });

  it("returns empty string for invalid date", () => {
    expect(formatRelative("not-a-date")).toBe("");
  });
});

describe("messages — requestInboxTab", () => {
  it("returns null for cancelled requests", () => {
    expect(requestInboxTab({ status: "Cancelled", type: "Borrow" })).toBeNull();
  });

  it("returns ongoing for pending requests", () => {
    expect(requestInboxTab({ status: "Pending", type: "Borrow" })).toBe("ongoing");
  });

  it("returns archived for declined requests", () => {
    expect(requestInboxTab({ status: "Declined", type: "Borrow" })).toBe("archived");
  });

  it("returns archived for returned requests", () => {
    expect(requestInboxTab({ status: "Returned", type: "Borrow" })).toBe("archived");
  });

  it("returns ongoing for accepted borrow", () => {
    expect(requestInboxTab({ status: "Accepted", type: "Borrow" })).toBe("ongoing");
  });

  it("returns archived for accepted exchange", () => {
    expect(requestInboxTab({ status: "Accepted", type: "Exchange" })).toBe("archived");
  });
});

describe("messages — requestAllowsSending", () => {
  it("returns false for cancelled", () => {
    expect(requestAllowsSending({ status: "Cancelled", type: "Borrow" })).toBe(false);
  });

  it("returns true for pending", () => {
    expect(requestAllowsSending({ status: "Pending", type: "Borrow" })).toBe(true);
  });

  it("returns false for declined", () => {
    expect(requestAllowsSending({ status: "Declined", type: "Borrow" })).toBe(false);
  });

  it("returns true for accepted borrow", () => {
    expect(requestAllowsSending({ status: "Accepted", type: "Borrow" })).toBe(true);
  });

  it("returns false for accepted exchange", () => {
    expect(requestAllowsSending({ status: "Accepted", type: "Exchange" })).toBe(false);
  });
});

describe("messages — threadFromRequest", () => {
  const baseRequest = {
    _id: "req1",
    bookOwner: { _id: "owner1", username: "Alice" },
    requesterId: { _id: "req2", username: "Bob" },
    bookId: { bookTitle: "Dune" },
    status: "Pending",
  };

  it("sets partnerName to requester when session user is the owner", () => {
    const thread = threadFromRequest(baseRequest, "owner1");
    expect(thread.partnerName).toBe("@Bob");
  });

  it("sets partnerName to owner when session user is the requester", () => {
    const thread = threadFromRequest(baseRequest, "req2");
    expect(thread.partnerName).toBe("@Alice");
  });

  it("sets partnerId correctly for owner", () => {
    const thread = threadFromRequest(baseRequest, "owner1");
    expect(thread.partnerId).toBe("req2");
  });

  it("uses book title from bookId", () => {
    const thread = threadFromRequest(baseRequest, "owner1");
    expect(thread.title).toBe("Dune");
  });

  it("falls back to Untitled when bookId is missing", () => {
    const thread = threadFromRequest({ ...baseRequest, bookId: null }, "owner1");
    expect(thread.title).toBe("Untitled");
  });
});
