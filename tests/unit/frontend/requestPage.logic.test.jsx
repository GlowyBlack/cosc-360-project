import { describe, it, expect } from "@jest/globals";

// Pure utility functions extracted from RequestPage.jsx
// These handle request status normalisation, history classification,
// borrow duration calculation, and progress tracking

function requestTypeNorm(t) {
  return String(t ?? "").toLowerCase();
}

function statusNorm(s) {
  return String(s ?? "").toLowerCase();
}

function normalizedStatus(raw) {
  const r = String(raw ?? "");
  return statusNorm(r === "Rejected" ? "Declined" : r);
}

function isHistoryStatus(rawStatus) {
  const st = normalizedStatus(rawStatus);
  return ["accepted", "returned", "cancelled", "declined"].includes(st);
}

function formatDueIn(returnBy) {
  const end = new Date(returnBy).getTime();
  if (!Number.isFinite(end)) return "";
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

function proposedBorrowDurationDays(createdAt, returnBy) {
  const start = new Date(createdAt).getTime();
  const end = new Date(returnBy).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.max(1, Math.round((end - start) / 86400000));
}

function borrowProgressPct(createdAt, returnBy) {
  const start = new Date(createdAt).getTime();
  const end = new Date(returnBy).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 40;
  const p = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(p)));
}

describe("requestTypeNorm", () => {
  it("normalises borrow to lowercase", () => {
    expect(requestTypeNorm("Borrow")).toBe("borrow");
    expect(requestTypeNorm("BORROW")).toBe("borrow");
  });

  it("normalises exchange to lowercase", () => {
    expect(requestTypeNorm("Exchange")).toBe("exchange");
  });

  it("returns empty string for null or undefined", () => {
    expect(requestTypeNorm(null)).toBe("");
    expect(requestTypeNorm(undefined)).toBe("");
  });
});

describe("normalizedStatus", () => {
  it("normalises Pending to lowercase", () => {
    expect(normalizedStatus("Pending")).toBe("pending");
  });

  it("maps Rejected to declined", () => {
    expect(normalizedStatus("Rejected")).toBe("declined");
  });

  it("normalises Accepted to lowercase", () => {
    expect(normalizedStatus("Accepted")).toBe("accepted");
  });

  it("handles null gracefully", () => {
    expect(normalizedStatus(null)).toBe("");
  });
});

describe("isHistoryStatus", () => {
  it("returns true for accepted", () => {
    expect(isHistoryStatus("Accepted")).toBe(true);
  });

  it("returns true for returned", () => {
    expect(isHistoryStatus("Returned")).toBe(true);
  });

  it("returns true for cancelled", () => {
    expect(isHistoryStatus("Cancelled")).toBe(true);
  });

  it("returns true for declined", () => {
    expect(isHistoryStatus("Declined")).toBe(true);
  });

  it("returns true for legacy Rejected status", () => {
    expect(isHistoryStatus("Rejected")).toBe(true);
  });

  it("returns false for pending", () => {
    expect(isHistoryStatus("Pending")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isHistoryStatus("")).toBe(false);
  });
});

describe("formatDueIn", () => {
  it("returns Overdue when date is in the past", () => {
    const past = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(formatDueIn(past)).toBe("Overdue");
  });

  it("returns Due today when date is today", () => {
    const today = new Date(Date.now() + 60000).toISOString();
    expect(formatDueIn(today)).toBe("Due today");
  });

  it("returns plural days string for multiple days", () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString();
    expect(formatDueIn(future)).toBe("Due in 3 days");
  });

  it("returns singular day string for one day", () => {
    const future = new Date(Date.now() + 1.5 * 86400000).toISOString();
    expect(formatDueIn(future)).toBe("Due in 1 day");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDueIn("not-a-date")).toBe("");
  });
});

describe("proposedBorrowDurationDays", () => {
  it("returns null for invalid dates", () => {
    expect(proposedBorrowDurationDays("bad", "bad")).toBeNull();
  });

  it("returns null when returnBy is before createdAt", () => {
    const now = new Date().toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(proposedBorrowDurationDays(now, past)).toBeNull();
  });

  it("returns correct duration in days", () => {
    const start = new Date(Date.now() - 7 * 86400000).toISOString();
    const end = new Date().toISOString();
    expect(proposedBorrowDurationDays(start, end)).toBe(7);
  });

  it("returns minimum of 1 day", () => {
    const start = new Date(Date.now() - 100).toISOString();
    const end = new Date().toISOString();
    expect(proposedBorrowDurationDays(start, end)).toBe(1);
  });
});

describe("borrowProgressPct", () => {
  it("returns 40 as fallback for invalid dates", () => {
    expect(borrowProgressPct("bad", "bad")).toBe(40);
  });

  it("returns 0 at the start of the borrow period", () => {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(borrowProgressPct(start, end)).toBe(0);
  });

  it("returns 100 when past the end date", () => {
    const start = new Date(Date.now() - 14 * 86400000).toISOString();
    const end = new Date(Date.now() - 1 * 86400000).toISOString();
    expect(borrowProgressPct(start, end)).toBe(100);
  });

  it("returns a value between 0 and 100 mid-borrow", () => {
    const start = new Date(Date.now() - 3 * 86400000).toISOString();
    const end = new Date(Date.now() + 4 * 86400000).toISOString();
    const pct = borrowProgressPct(start, end);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});