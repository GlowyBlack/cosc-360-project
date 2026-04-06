import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { toLibraryPageCardBook } from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";

import LibraryBookCard from "./LibraryBookCard.jsx";
import "./LibraryPage.css";

const TABS = [
  { id: "my", label: "MY BOOKS" },
  { id: "borrowed", label: "BORROWED BOOKS" },
  { id: "lent", label: "LENT OUT" },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("my");
  const [togglingBookId, setTogglingBookId] = useState("");

  const handleToggleAvailability = async (bookId) => {
    setError("");
    setTogglingBookId(bookId);
    try {
      const response = await fetch(
        `${API}/books/${bookId}/toggle-availability`,
        {
          method: "POST",
          headers: { ...authHeader() },
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(
          data.message ?? data.detail ?? data.error ?? "Could not update availability",
        );
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
    const ok = window.confirm(
      `Remove “${title}” from your library? This cannot be undone.`,
    );
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
        throw new Error(
          delData.message ?? delData.detail ?? "Failed to delete book",
        );
      }
      setBooks((prev) =>
        prev.filter((b) => String(b._id ?? b.id) !== String(bookId)),
      );
    } catch (e) {
      setError(e.message ?? "Failed to delete book");
    }
  };

  useEffect(() => {
    async function loadMyBooks() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API}/books/me`, {
          headers: {
            ...authHeader(),
          },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(data.message ?? data.detail ?? "Failed to load your books");
        }
        setBooks(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message ?? "Failed to load your books");
      } finally {
        setLoading(false);
      }
    }

    loadMyBooks();
  }, []);

  const cardBooks = useMemo(
    () => books.map((b) => toLibraryPageCardBook(b, user)),
    [books, user],
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="library-page">
      <Header variant="user" />
      <main className="library-page-main">
        <section className="library-hero" aria-labelledby="library-hero-title">
          <div className="library-hero-text">
            <h1 id="library-hero-title" className="library-hero-title">
              Your Library
            </h1>
            <p className="library-hero-lede">
              Manage your collection, track loans, and discover what your
              community is reading.
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

        <div
          className="library-tabs"
          role="tablist"
          aria-label="Library sections"
        >
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

        {loading ? (
          <p className="library-page-state">Loading your books...</p>
        ) : null}
        {error ? <p className="library-page-state library-page-state--error">{error}</p> : null}

        {!loading && !error && activeTab === "my" ? (
          <section className="library-page-grid" aria-labelledby="library-tab-my">
            {cardBooks.length === 0 ? (
              <p className="library-page-state library-page-state--empty">
                You haven&apos;t added any books yet. Use{" "}
                <strong>+ Add New Book</strong> when you&apos;re ready.
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
            <p className="library-page-state library-page-state--empty">
              No borrowed books yet. When you borrow from someone, they&apos;ll
              show up here.
            </p>
          </section>
        ) : null}

        {!loading && !error && activeTab === "lent" ? (
          <section className="library-page-grid" aria-labelledby="library-tab-lent">
            <p className="library-page-state library-page-state--empty">
              Nothing lent out yet. Active loans will appear here.
            </p>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
