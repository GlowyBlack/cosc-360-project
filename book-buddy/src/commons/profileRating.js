export function getRatingScore(doc) {
  if (!doc) return null;
  const total = Number(doc.totalScore ?? 0);
  const count = Number(doc.reviewCounts ?? 0);
  if (!Number.isFinite(total) || !Number.isFinite(count) || count < 1) return null;
  return total / count;
}
