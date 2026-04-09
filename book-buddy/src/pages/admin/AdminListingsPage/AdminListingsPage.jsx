import { useEffect, useMemo, useState } from "react";
import API, { authHeader } from "../../../config/api.js";
import { BOOK_GENRES } from "../../../constants/bookGenres.js";
import "./AdminListingsPage.css";
import "../AdminDashboardPage/AdminDashboardPage.css";

const PAGE_SIZE = 10;
const PAGE_BUTTON_WINDOW = 10;

function ownerDisplay(book) {
  const o = book.bookOwner;
  if (!o) return { label: "—", email: "" };
  if (typeof o === "object" && o._id) {
    return {
      label: o.username ?? "—",
      email: o.email ?? "",
    };
  }
  return { label: String(o).slice(0, 8) + "…", email: "" };
}

function formatGenres(genre) {
  if (!Array.isArray(genre) || genre.length === 0) return "—";
  const s = genre.join(", ");
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

export default function AdminListingsPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  /** Empty string = all genres */
  const [genreFilter, setGenreFilter] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/admin/books`, {
          headers: { ...authHeader() },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load listings");
        }
        const data = await res.json().catch(() => []);
        if (!cancelled) setBooks(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to load listings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBooks = useMemo(() => {
    let list = books;
    if (genreFilter) {
      list = list.filter(
        (b) =>
          Array.isArray(b.genre) && b.genre.includes(genreFilter)
      );
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const title = String(b.bookTitle ?? "").toLowerCase();
      const author = String(b.bookAuthor ?? "").toLowerCase();
      const desc = String(b.description ?? "").toLowerCase();
      const { label, email } = ownerDisplay(b);
      const ownerHay = `${label} ${email}`.toLowerCase();
      return (
        title.includes(q) ||
        author.includes(q) ||
        desc.includes(q) ||
        ownerHay.includes(q)
      );
    });
  }, [books, query, genreFilter]);

  const totalPages = useMemo(() => {
    if (filteredBooks.length === 0) return 0;
    return Math.ceil(filteredBooks.length / PAGE_SIZE);
  }, [filteredBooks.length]);

  useEffect(() => {
    setPage(1);
  }, [query, genreFilter]);

  useEffect(() => {
    if (totalPages === 0) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedBooks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredBooks.slice(start, start + PAGE_SIZE);
  }, [filteredBooks, page]);

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

  async function deleteListing(book) {
    const id = String(book._id);
    const title = String(book.bookTitle ?? "this book");
    if (
      !window.confirm(
        `Remove “${title}” from the catalog? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(id);
    setActionError("");
    try {
      const res = await fetch(`${API}/admin/books/${id}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message ?? "Could not remove listing"
        );
      }
      setBooks((prev) => prev.filter((b) => String(b._id) !== id));
    } catch (e) {
      setActionError(e.message ?? "Could not remove listing");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page admin-listings">
      <header className="admin-listings__header">
        <div>
          <h1 className="admin-listings__title">Listing Management</h1>
          <p className="admin-listings__subtitle">
            Browse all book listings, filter the database, and remove entries
            that violate policy or are no longer valid. Listings tied to active
            borrows or pending requests cannot be deleted.
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

      <div className="admin-listings__toolbar">
        <label className="admin-listings__search-label" htmlFor="admin-listings-q">
          Filter catalog
        </label>
        <div className="admin-listings__filters">
          <input
            id="admin-listings-q"
            type="search"
            className="admin-listings__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, owner, or description…"
            autoComplete="off"
          />
          <label className="admin-listings__genre-label" htmlFor="admin-listings-genre">
            Genre
          </label>
          <select
            id="admin-listings-genre"
            className="admin-listings__genre"
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            aria-label="Filter by genre"
          >
            <option value="">All genres</option>
            {BOOK_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <span className="admin-listings__meta">
          {loading
            ? "Loading…"
            : totalPages === 0
              ? `0 listings`
              : totalPages === 1
                ? `${filteredBooks.length} listing${filteredBooks.length === 1 ? "" : "s"}`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredBooks.length)} of ${filteredBooks.length}`}
        </span>
      </div>

      <div className="admin-table-wrap admin-listings__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-listings__col-cover">Cover</th>
              <th>Title</th>
              <th>Author</th>
              <th>Owner</th>
              <th>Condition</th>
              <th>Genres</th>
              <th>Status</th>
              <th>Listed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="admin-table__empty">
                  Loading listings…
                </td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-table__empty">
                  {books.length === 0
                    ? "No listings in the catalog."
                    : "No listings match your filter."}
                </td>
              </tr>
            ) : (
              paginatedBooks.map((b) => {
                const id = String(b._id);
                const busy = deletingId === id;
                const { label: ownerName, email: ownerEmail } = ownerDisplay(b);
                const available = b.isAvailable !== false;
                return (
                  <tr key={id}>
                    <td className="admin-listings__cover-cell">
                      {b.bookImage ? (
                        <img
                          className="admin-listings__thumb"
                          src={b.bookImage}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="admin-listings__no-cover">—</span>
                      )}
                    </td>
                    <td>
                      <span className="admin-listings__book-title">
                        {b.bookTitle ?? "—"}
                      </span>
                    </td>
                    <td>{b.bookAuthor ?? "—"}</td>
                    <td>
                      <div className="admin-listings__owner">
                        <span>{ownerName}</span>
                        {ownerEmail ? (
                          <span className="admin-listings__owner-email">
                            {ownerEmail}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{b.condition ?? "—"}</td>
                    <td className="admin-listings__genres">
                      {formatGenres(b.genre)}
                    </td>
                    <td>
                      <span
                        className={`admin-listings__avail admin-listings__avail--${available ? "yes" : "no"}`}
                      >
                        {available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="admin-listings__date">
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--solid admin-listings__delete"
                        disabled={busy}
                        onClick={() => deleteListing(b)}
                      >
                        {busy ? "Removing…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 ? (
        <nav
          className="admin-listings__pagination"
          aria-label="Listing pages"
        >
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-listings__pagination-step"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="admin-listings__pagination-pages">
            {showPageWindow && windowStart > 1 ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-listings__pagination-chunk"
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
                    ? "admin-btn admin-btn--solid admin-listings__pagination-num is-active"
                    : "admin-btn admin-btn--outline admin-listings__pagination-num"
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
                className="admin-btn admin-btn--outline admin-listings__pagination-chunk"
                aria-label="Show next group of pages"
                onClick={() => setPage(windowEnd + 1)}
              >
                …
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-listings__pagination-step"
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
