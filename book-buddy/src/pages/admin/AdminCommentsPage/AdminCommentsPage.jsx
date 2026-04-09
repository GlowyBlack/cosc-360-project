import { useEffect, useMemo, useState } from "react";
import API, { authHeader } from "../../../config/api.js";
import "./AdminCommentsPage.css";
import "../AdminDashboardPage/AdminDashboardPage.css";

const PAGE_SIZE = 10;
const PAGE_BUTTON_WINDOW = 10;

function authorDisplay(comment) {
  const a = comment.authorId;
  if (!a) return { label: "—", sub: "" };
  if (typeof a === "object" && a._id) {
    return {
      label: a.username ?? "—",
      sub: a.email ?? a.role ?? "",
    };
  }
  return { label: String(a).slice(0, 8) + "…", sub: "" };
}

function postTitleDisplay(comment) {
  const p = comment.postId;
  if (!p) return "—";
  if (typeof p === "object" && p._id) return p.title ?? "—";
  return String(p).slice(0, 8) + "…";
}

function clampText(s, max = 140) {
  const t = String(s ?? "").trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showRemoved, setShowRemoved] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/admin/comments?includeRemoved=1`, {
          headers: { ...authHeader() },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load comments");
        }
        const data = await res.json().catch(() => []);
        if (!cancelled) setComments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to load comments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleComments = useMemo(() => {
    if (showRemoved) return comments;
    return comments.filter((c) => !c.isRemoved);
  }, [comments, showRemoved]);

  const filteredComments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleComments;
    return visibleComments.filter((c) => {
      const content = String(c.content ?? "").toLowerCase();
      const postTitle = postTitleDisplay(c).toLowerCase();
      const { label, sub } = authorDisplay(c);
      const authorHay = `${label} ${sub}`.toLowerCase();
      const isReply = c.parentId != null;
      return (
        content.includes(q) ||
        postTitle.includes(q) ||
        authorHay.includes(q) ||
        (isReply && "reply".includes(q)) ||
        (!isReply && "comment".includes(q))
      );
    });
  }, [visibleComments, query]);

  const totalPages = useMemo(() => {
    if (filteredComments.length === 0) return 0;
    return Math.ceil(filteredComments.length / PAGE_SIZE);
  }, [filteredComments.length]);

  useEffect(() => {
    setPage(1);
  }, [query, showRemoved]);

  useEffect(() => {
    if (totalPages === 0) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedComments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredComments.slice(start, start + PAGE_SIZE);
  }, [filteredComments, page]);

  const { windowStart, windowEnd, showPageWindow } = useMemo(() => {
    if (totalPages === 0) {
      return { windowStart: 1, windowEnd: 1, showPageWindow: false };
    }
    if (totalPages <= PAGE_BUTTON_WINDOW) {
      return {
        windowStart: 1,
        windowEnd: totalPages,
        showPageWindow: false,
      };
    }
    const ws =
      Math.floor((page - 1) / PAGE_BUTTON_WINDOW) * PAGE_BUTTON_WINDOW + 1;
    const we = Math.min(ws + PAGE_BUTTON_WINDOW - 1, totalPages);
    return { windowStart: ws, windowEnd: we, showPageWindow: true };
  }, [totalPages, page]);

  async function runAction(commentId, action) {
    const id = String(commentId);
    setActingId(id);
    setActionError("");

    const paths = {
      remove: `/admin/comments/${id}/remove`,
      restore: `/admin/comments/${id}/restore`,
    };

    try {
      const res = await fetch(`${API}${paths[action]}`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Request failed");
      }
      const updated = await res.json().catch(() => null);
      setComments((prev) =>
        prev.map((c) => (String(c._id) === id ? (updated ?? c) : c))
      );
    } catch (e) {
      setActionError(e.message ?? "Action failed");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="admin-page admin-comments">
      <header className="admin-comments__header">
        <div>
          <h1 className="admin-comments__title">Comments management</h1>
          <p className="admin-comments__subtitle">
            Moderate comment threads by removing abusive or spammy content. You
            can also restore previously removed comments.
          </p>
        </div>
      </header>

      {error ? (
        <p className="admin-dashboard__error" role="alert">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p className="admin-dashboard__error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="admin-comments__toolbar">
        <label
          className="admin-comments__search-label"
          htmlFor="admin-comments-q"
        >
          Filter comments
        </label>
        <div className="admin-comments__filters">
          <input
            id="admin-comments-q"
            type="search"
            className="admin-comments__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by content, author, or post title…"
            autoComplete="off"
          />
          <label className="admin-comments__toggle">
            <input
              type="checkbox"
              checked={showRemoved}
              onChange={(e) => setShowRemoved(e.target.checked)}
            />
            Show removed
          </label>
        </div>
        <span className="admin-comments__meta">
          {loading
            ? "Loading…"
            : totalPages === 0
              ? `0 comments`
              : totalPages === 1
                ? `${filteredComments.length} comment${
                    filteredComments.length === 1 ? "" : "s"
                  }`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                    page * PAGE_SIZE,
                    filteredComments.length
                  )} of ${filteredComments.length}`}
        </span>
      </div>

      <div className="admin-table-wrap admin-comments__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Content</th>
              <th>Author</th>
              <th>Post</th>
              <th>Type</th>
              <th>Likes</th>
              <th>Status</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="admin-table__empty">
                  Loading comments…
                </td>
              </tr>
            ) : filteredComments.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table__empty">
                  {comments.length === 0
                    ? "No comments returned from the server."
                    : "No comments match your filters."}
                </td>
              </tr>
            ) : (
              paginatedComments.map((c) => {
                const id = String(c._id);
                const busy = actingId === id;
                const removed = !!c.isRemoved;
                const isReply = c.parentId != null;
                const { label: authorName, sub: authorSub } = authorDisplay(c);
                return (
                  <tr key={id}>
                    <td className="admin-comments__content">
                      {clampText(c.content, 160)}
                    </td>
                    <td>
                      <div className="admin-comments__author">
                        <span>{authorName}</span>
                        {authorSub ? (
                          <span className="admin-comments__author-sub">
                            {authorSub}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="admin-comments__post-title">
                      {postTitleDisplay(c)}
                    </td>
                    <td>{isReply ? "Reply" : "Comment"}</td>
                    <td>{Array.isArray(c.likes) ? c.likes.length : 0}</td>
                    <td>
                      <span
                        className={`admin-comments__status admin-comments__status--${
                          removed ? "removed" : "active"
                        }`}
                      >
                        {removed ? "Removed" : "Active"}
                      </span>
                    </td>
                    <td className="admin-comments__date">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      {!removed ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--solid admin-comments__action-btn"
                          disabled={busy}
                          onClick={() => runAction(c._id, "remove")}
                        >
                          {busy ? "Removing…" : "Remove"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline admin-comments__action-btn"
                          disabled={busy}
                          onClick={() => runAction(c._id, "restore")}
                        >
                          {busy ? "Restoring…" : "Restore"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 ? (
        <nav className="admin-comments__pagination" aria-label="Comment pages">
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-comments__pagination-step"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="admin-comments__pagination-pages">
            {showPageWindow && windowStart > 1 ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-comments__pagination-chunk"
                aria-label="Show previous group of pages"
                onClick={() => setPage(windowStart - 1)}
              >
                …
              </button>
            ) : null}
            {Array.from(
              { length: Math.max(0, windowEnd - windowStart + 1) },
              (_, i) => windowStart + i
            ).map((pnum) => (
              <button
                key={pnum}
                type="button"
                className={
                  pnum === page
                    ? "admin-btn admin-btn--solid admin-comments__pagination-num is-active"
                    : "admin-btn admin-btn--outline admin-comments__pagination-num"
                }
                aria-current={pnum === page ? "page" : undefined}
                onClick={() => setPage(pnum)}
              >
                {pnum}
              </button>
            ))}
            {showPageWindow && windowEnd < totalPages ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-comments__pagination-chunk"
                aria-label="Show next group of pages"
                onClick={() => setPage(windowEnd + 1)}
              >
                …
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-comments__pagination-step"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}

