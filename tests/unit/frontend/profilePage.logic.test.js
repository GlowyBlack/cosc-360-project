import { describe, it, expect } from "@jest/globals";

// Pure functions extracted from ProfilePage.jsx

function formatMemberSince(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatStatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
}

function relativeListedAt(value) {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "Listed recently";
  const diff = Date.now() - t;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / dayMs);
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed 1 day ago";
  return `Listed ${days} days ago`;
}

function sincePost(value) {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

describe("profile — formatMemberSince", () => {
  it("returns empty string for invalid date", () => {
    expect(formatMemberSince("not-a-date")).toBe("");
  });

  it("returns a formatted date string for a valid date", () => {
    const result = formatMemberSince("2023-01-15");
    expect(result).toMatch(/Jan|January/);
    expect(result).toContain("2023");
  });

  it("handles a timestamp number", () => {
    const result = formatMemberSince(new Date("2022-06-01").getTime());
    expect(result).toContain("2022");
  });
});

describe("profile — formatStatNumber", () => {
  it("returns 0 for non-numeric input", () => {
    expect(formatStatNumber("abc")).toBe("0");
  });

  it("returns 0 for null", () => {
    expect(formatStatNumber(null)).toBe("0");
  });

  it("formats a number correctly", () => {
    expect(formatStatNumber(5)).toBe("5");
  });

  it("formats a large number with locale separators", () => {
    const result = formatStatNumber(1000);
    expect(result).toMatch(/1[,.]?000/);
  });

  it("returns 0 for NaN", () => {
    expect(formatStatNumber(NaN)).toBe("0");
  });
});

describe("profile — relativeListedAt", () => {
  it("returns Listed recently for invalid date", () => {
    expect(relativeListedAt("bad")).toBe("Listed recently");
  });

  it("returns Listed today for today", () => {
    expect(relativeListedAt(new Date().toISOString())).toBe("Listed today");
  });

  it("returns Listed 1 day ago for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000 * 1.5).toISOString();
    expect(relativeListedAt(yesterday)).toBe("Listed 1 day ago");
  });

  it("returns plural days for older dates", () => {
    const older = new Date(Date.now() - 86400000 * 5).toISOString();
    expect(relativeListedAt(older)).toBe("Listed 5 days ago");
  });
});

describe("profile — sincePost", () => {
  it("returns empty string for invalid date", () => {
    expect(sincePost("bad")).toBe("");
  });

  it("returns just now for very recent posts", () => {
    expect(sincePost(new Date().toISOString())).toBe("just now");
  });

  it("returns minutes ago for recent posts", () => {
    const result = sincePost(new Date(Date.now() - 5 * 60000).toISOString());
    expect(result).toBe("5m ago");
  });

  it("returns hours ago for posts a few hours old", () => {
    const result = sincePost(new Date(Date.now() - 3 * 3600000).toISOString());
    expect(result).toBe("3h ago");
  });

  it("returns days ago for older posts", () => {
    const result = sincePost(new Date(Date.now() - 2 * 86400000).toISOString());
    expect(result).toBe("2d ago");
  });
});
