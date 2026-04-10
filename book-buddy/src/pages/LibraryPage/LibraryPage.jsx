import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { toLibraryPageCardBook, getSessionUserId, coverSrcOrFallback } from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import LibraryBookCard from "./LibraryBookCard.jsx";
import "./LibraryPage.css";

const TABS = [
  { id: "my", label: "MY BOOKS" },
  { id: "borrowed", label: "BORROWED BOOKS" },
  { id: "lent", label: "LENT OUT" },
];

const socket = io("http://localhost:5001");

function idString(ref) {
  if (ref == null) return "";
  if (typeof ref === "object") return String(ref._id ?? ref.id ?? "");
  return String(ref);
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const sessionId = getSessionUserId(user);
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("my");
  const [togglingBookId, setTogglingBookId] = useState("");

  const handleToggleAvailability = async (bookId) => {
    setError("");
    setTogglingBookId(bookId);
    try {
      const response = await fetch(`${API}/books/${bookId}/toggle-availability`, {
        method: "POST",
        headers: { ...authHeader() },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? data.detail ?? data.error ?? "Could not update availability");
      }
      const nextAvailable = data.isAvailable === true;
      setBooks((prev) =>
        prev.map((b) => {
          const id = String(b._id ?? b.id);
          if (id !== String(bookId)) return b;
          return { ...b, isAvailable: nextAvailable };
        }),
      );
    } catch (e) {
      setError(e.message ?? "Could not update availability");
    } finally {
      setTogglingBookId("");
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    const ok = window.confirm(`Remove "${title}" from your library? This cannot be undone.`);
    if (!ok) return;
    setError("");
    try {
      const response = await fetch(`${API}/books/${bookId}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        const delData = await response.json().catch(() => ({}));
        throw new Error(delData.message ?? delData.detail ?? "Failed to delete book");
      }
      setBooks((prev) => prev.filter((b) => String(b._id ?? b.id) !== String(bookId)));
      socket.emit("book_update");
    } catch (e) {
      setError(e.message ?? "Failed to delete book");
    }
  };

  const loadMyBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [booksRes, requestsRes] = await Promise.all([
        fetch(`${API}/books/me`, { headers: { ...authHeader() } }),
        fetch(`${API}/requests/me`, { headers: { ...authHeader() } }),
      ]);

      if (booksRes.status === 401 || requestsRes.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }

      const booksData = await booksRes.json().catch(() => ({}));
      if (!booksRes.ok) throw new Error(booksData.message ?? "Failed to load your books");
      setBooks(Array.isArray(booksData) ? booksData : []);

      const requestsData = await requestsRes.json().catch(() => ({}));
      if (requestsRes.ok) {
        const list = Array.isArray(requestsData) ? requestsData : [];
        setRequests(list);
      }
    } catch (e) {
      setError(e.message ?? "Failed to load your books");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadMyBooks();
  }, [loadMyBooks]);

  useEffect(() => {
    if (sessionId) socket.emit("join_user_room", sessionId);
    socket.on("request_update", () => {
      loadMyBooks();
    });
    return () => socket.off("request_update");
  }, [sessionId, loadMyBooks]);

  const cardBooks = useMemo(
    () => books.map((b) => toLibraryPageCardBook(b, user)),
    [books, user],
  );

  const borrowedBooks = useMemo(() => {
    return requests.filter((r) => {
      const type = String(r.type ?? "").toLowerCase();
      const status = String(r.status ?? "").toLowerCase();
      const requesterId = idString(r.requesterId);
      return type === "borrow" && status === "accepted" && requesterId === sessionId;
    });
  }, [requests, sessionId]);

  const lentBooks = useMemo(() => {
    return requests.filter((r) => {
      const type = String(r.type ?? "").toLowerCase();
      const status = String(r.status ?? "").toLowerCase();
      const ownerId = idString(r.bookOwner);
      return type === "borrow" && status === "accepted" && ownerId === sessionId;
    });
  }, [requests, sessionId]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="library-page">
      <Header variant="user" />
      <main className="library-page-main">
        <section className="library-hero" aria-labelledby="library-hero-title">
          <div className="library-hero-text">
            <h1 id="library-hero-title" className="library-hero-title">Your Library</h1>
            <p className="library-hero-lede">
              Manage your collection, track loans, and discover what your community is reading.
            </p>
          </div>
          <button
            type="button"
            className="library-add-book-btn"
            onClick={() => navigate("/add-book")}
          >
            + Add New Book
          </button>
        </section>

        <div className="library-tabs" role="tablist" aria-label="Library sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`library-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={`library-tab ${activeTab === tab.id ? "library-tab--active" : ""}`.trim()}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? <p className="library-page-state">Loading your books...</p> : null}
        {error ? <p className="library-page-state library-page-state--error">{error}</p> : null}

        {!loading && !error && activeTab === "my" ? (
          <section className="library-page-grid" aria-labelledby="library-tab-my">
            {cardBooks.length === 0 ? (
              <p className="library-page-state library-page-state--empty">
                You haven&apos;t added any books yet. Use <strong>+ Add New Book</strong> when you&apos;re ready.
              </p>
            ) : (
              cardBooks.map((book) => (
                <LibraryBookCard
                  key={book.id}
                  bookId={book.id}
                  title={book.title}
                  author={book.author}
                  coverSrc={book.cover.src}
                  coverAlt={book.cover.alt}
                  isAvailable={book.isAvailable}
                  onLoan={book.onLoan}
                  requestCount={book.pendingRequestCount}
                  availabilityBusy={togglingBookId === book.id}
                  onToggleAvailability={() => handleToggleAvailability(book.id)}
                  onEdit={() => navigate(`/library/edit/${book.id}`)}
                  onDelete={() => void handleDeleteBook(book.id, book.title)}
                />
              ))
            )}
          </section>
        ) : null}

        {!loading && !error && activeTab === "borrowed" ? (
          <section className="library-page-grid" aria-labelledby="library-tab-borrowed">
            {borrowedBooks.length === 0 ? (
              <p className="library-page-state library-page-state--empty">
                No borrowed books yet. When a borrow request is accepted, it will appear here.
              </p>
            ) : (
              borrowedBooks.map((req) => {
                const book = req.bookId;
                const id = idString(req._id ?? req.id);
                const title = book?.bookTitle ?? book?.title ?? "Untitled";
                const author = book?.bookAuthor ?? book?.author ?? "Unknown";
                const coverSrc = coverSrcOrFallback(book?.bookImage ?? "");
                return (
                  <LibraryBookCard
                    key={id}
                    title={title}
                    author={author}
                    coverSrc={coverSrc}
                    coverAlt={`Cover: ${title}`}
                    isAvailable={false}
                    onLoan={true}
                  />
                );
              })
            )}
          </section>
        ) : null}

        {!loading && !error && activeTab === "lent" ? (
          <section className="library-page-grid" aria-labelledby="library-tab-lent">
            {lentBooks.length === 0 ? (
              <p className="library-page-state library-page-state--empty">
                Nothing lent out yet. Active loans will appear here.
              </p>
            ) : (
              lentBooks.map((req) => {
                const book = req.bookId;
                const id = idString(req._id ?? req.id);
                const title = book?.bookTitle ?? book?.title ?? "Untitled";
                const author = book?.bookAuthor ?? book?.author ?? "Unknown";
                const coverSrc = coverSrcOrFallback(book?.bookImage ?? "");
                const borrower = req.requesterId?.username
                  ? `@${req.requesterId.username}`
                  : "a reader";
                return (
                  <LibraryBookCard
                    key={id}
                    title={title}
                    author={author}
                    coverSrc={coverSrc}
                    coverAlt={`Cover: ${title}`}
                    isAvailable={false}
                    onLoan={true}
                    requestCount={0}
                  />
                );
              })
            )}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}