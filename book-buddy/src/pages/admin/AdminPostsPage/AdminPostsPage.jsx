import { useEffect, useMemo, useState } from "react";
import API, { authHeader } from "../../../config/api.js";
import "./AdminPostsPage.css";
import "../AdminDashboardPage/AdminDashboardPage.css";

const PAGE_SIZE = 10;
const PAGE_BUTTON_WINDOW = 10;

function authorDisplay(post) {
  const a = post.authorId;
  if (!a) return { label: "—", sub: "" };
  if (typeof a === "object" && a._id) {
    return {
      label: a.username ?? "—",
      sub: a.email ?? a.role ?? "",
    };
  }
  return { label: String(a).slice(0, 8) + "…", sub: "" };
}

function formatGenre(genre) {
  if (!Array.isArray(genre) || genre.length === 0) return "—";
  const s = genre.join(", ");
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

function formatBookTag(bookTag) {
  const title = String(bookTag?.title ?? "").trim();
  const author = String(bookTag?.author ?? "").trim();
  const s = [title, author].filter(Boolean).join(" — ");
  if (!s) return "—";
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
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
        const res = await fetch(`${API}/admin/posts?includeRemoved=1`, {
          headers: { ...authHeader() },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load posts");
        }
        const data = await res.json().catch(() => []);
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to load posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePosts = useMemo(() => {
    if (showRemoved) return posts;
    return posts.filter((p) => !p.isRemoved);
  }, [posts, showRemoved]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visiblePosts;
    return visiblePosts.filter((p) => {
      const title = String(p.title ?? "").toLowerCase();
      const content = String(p.content ?? "").toLowerCase();
      const genres = (Array.isArray(p.genre) ? p.genre : [])
        .join(" ")
        .toLowerCase();
      const tag = `${p.bookTag?.title ?? ""} ${p.bookTag?.author ?? ""}`.toLowerCase();
      const { label, sub } = authorDisplay(p);
      const authorHay = `${label} ${sub}`.toLowerCase();
      return (
        title.includes(q) ||
        content.includes(q) ||
        genres.includes(q) ||
        tag.includes(q) ||
        authorHay.includes(q)
      );
    });
  }, [visiblePosts, query]);

  const totalPages = useMemo(() => {
    if (filteredPosts.length === 0) return 0;
    return Math.ceil(filteredPosts.length / PAGE_SIZE);
  }, [filteredPosts.length]);

  useEffect(() => {
    setPage(1);
  }, [query, showRemoved]);

  useEffect(() => {
    if (totalPages === 0) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, page]);

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

  async function runAction(postId, action) {
    const id = String(postId);
    setActingId(id);
    setActionError("");

    const paths = {
      remove: `/admin/posts/${id}/remove`,
      restore: `/admin/posts/${id}/restore`,
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
      setPosts((prev) =>
        prev.map((p) => (String(p._id) === id ? (updated ?? p) : p))
      );
    } catch (e) {
      setActionError(e.message ?? "Action failed");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="admin-page admin-posts">
      <header className="admin-posts__header">
        <div>
          <h1 className="admin-posts__title">Posts Management</h1>
          <p className="admin-posts__subtitle">
            Review community posts and remove content that violates policy. You
            can also restore previously removed posts.
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

      <div className="admin-posts__toolbar">
        <label className="admin-posts__search-label" htmlFor="admin-posts-q">
          Filter posts
        </label>
        <div className="admin-posts__filters">
          <input
            id="admin-posts-q"
            type="search"
            className="admin-posts__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, tag, genre, or content…"
            autoComplete="off"
          />
          <label className="admin-posts__toggle">
            <input
              type="checkbox"
              checked={showRemoved}
              onChange={(e) => setShowRemoved(e.target.checked)}
            />
            Show removed
          </label>
        </div>
        <span className="admin-posts__meta">
          {loading
            ? "Loading…"
            : totalPages === 0
              ? `0 posts`
              : totalPages === 1
                ? `${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"}`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredPosts.length)} of ${filteredPosts.length}`}
        </span>
      </div>

      <div className="admin-table-wrap admin-posts__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genres</th>
              <th>Book tag</th>
              <th>Reactions</th>
              <th>Status</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="admin-table__empty">
                  Loading posts…
                </td>
              </tr>
            ) : filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table__empty">
                  {posts.length === 0
                    ? "No posts returned from the server."
                    : "No posts match your filters."}
                </td>
              </tr>
            ) : (
              paginatedPosts.map((p) => {
                const id = String(p._id);
                const busy = actingId === id;
                const removed = !!p.isRemoved;
                const { label: authorName, sub: authorSub } = authorDisplay(p);
                return (
                  <tr key={id}>
                    <td>
                      <span className="admin-posts__post-title">
                        {p.title ?? "—"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-posts__author">
                        <span>{authorName}</span>
                        {authorSub ? (
                          <span className="admin-posts__author-sub">
                            {authorSub}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatGenre(p.genre)}</td>
                    <td className="admin-posts__tag">
                      {formatBookTag(p.bookTag)}
                    </td>
                    <td>
                      {Number(p.likeCount ?? 0)} / {Number(p.dislikeCount ?? 0)}
                    </td>
                    <td>
                      <span
                        className={`admin-posts__status admin-posts__status--${removed ? "removed" : "active"}`}
                      >
                        {removed ? "Removed" : "Active"}
                      </span>
                    </td>
                    <td className="admin-posts__date">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString(undefined, {
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
                          className="admin-btn admin-btn--solid admin-posts__action-btn"
                          disabled={busy}
                          onClick={() => runAction(p._id, "remove")}
                        >
                          {busy ? "Removing…" : "Remove"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline admin-posts__action-btn"
                          disabled={busy}
                          onClick={() => runAction(p._id, "restore")}
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
        <nav className="admin-posts__pagination" aria-label="Post pages">
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-posts__pagination-step"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="admin-posts__pagination-pages">
            {showPageWindow && windowStart > 1 ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-posts__pagination-chunk"
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
                    ? "admin-btn admin-btn--solid admin-posts__pagination-num is-active"
                    : "admin-btn admin-btn--outline admin-posts__pagination-num"
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
                className="admin-btn admin-btn--outline admin-posts__pagination-chunk"
                aria-label="Show next group of pages"
                onClick={() => setPage(windowEnd + 1)}
              >
                …
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-posts__pagination-step"
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

