import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import BookCard from "../../components/BookCard/BookCard.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import Button from "../../components/Button/Button.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { DISCOVER_FILTERS } from "../../data/discoverBooks.js";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import {
  bookGenreMatchesFilter,
  toDiscoverCardBook,
} from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./DiscoverPage.css";

const socket = io("http://localhost:5001");

const DISCOVER_INITIAL_VISIBLE = 8;
const DISCOVER_LOAD_MORE_STEP = 8;

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [books, setBooks] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(DISCOVER_INITIAL_VISIBLE);

  const cardBooks = useMemo(() => books.map(toDiscoverCardBook), [books]);

  const filteredBooks = useMemo(() => {
    if (activeFilter === "All") return cardBooks;
    return cardBooks.filter((b) =>
      bookGenreMatchesFilter(b.genre, activeFilter),
    );
  }, [activeFilter, cardBooks]);

  const visibleBooks = useMemo(
    () => filteredBooks.slice(0, visibleCount),
    [filteredBooks, visibleCount],
  );

  const hasMoreBooks = visibleCount < filteredBooks.length;

  const loadBooks = useCallback(async () => {
    try {
      const response = await fetch(`${API}/books/`);
      const data = await response.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      if (!user) {
        setWishlistIds(new Set());
        return;
      }

      try {
        const response = await fetch(`${API}/user/wishlist`, {
          headers: { ...authHeader() },
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load wishlist");
        }

        if (!cancelled) {
          setWishlistIds(
            new Set(
              (Array.isArray(data) ? data : []).map((book) =>
                String(book?._id ?? book?.id ?? ""),
              ),
            ),
          );
        }
      } catch (error) {
        console.log(error);
      }
    }

    loadWishlist();
    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  useEffect(() => {
    socket.on("book_update", () => {
      loadBooks();
    });
    return () => socket.off("book_update");
  }, [loadBooks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="discover-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="discover-page-main">
        <header className="discover-page-intro">
          <h3 className="discover-page-lede">
            Browse books shared by readers near you. Filter by genre to find
            your next swap.
          </h3>
        </header>

        <form
          className="discover-page-search"
          onSubmit={handleSearchSubmit}
          role="search"
          aria-label="Search books"
        >
          <TextField
            id="discover-search"
            name="q"
            label="Search"
            type="search"
            placeholder="Search books, authors, genres…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="discover-page-search-field"
          />
          <Button
            type="submit"
            variant="terracotta"
            className="discover-page-search-submit"
            disabled={!searchQuery.trim()}
          >
            <span className="discover-page-search-submit-inner">
              Search
              <MaterialIcon name="search" className="discover-page-search-icon" />
            </span>
          </Button>
        </form>

        <div
          className="discover-page-filters"
          role="toolbar"
          aria-label="Filter by genre"
        >
          {DISCOVER_FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              className={`discover-page-filter ${
                activeFilter === label ? "discover-page-filter--active" : ""
              }`.trim()}
              aria-pressed={activeFilter === label}
              onClick={() => {
                setActiveFilter(label);
                setVisibleCount(DISCOVER_INITIAL_VISIBLE);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="discover-page-grid" aria-label="Book listings">
          {filteredBooks.length === 0 ? (
            <p className="discover-page-empty">
              No books in this genre yet. Try another filter.
            </p>
          ) : (
            visibleBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                cover={book.cover}
                title={book.title}
                author={book.author}
                owner={book.owner}
                location={book.location}
                status={book.status}
                wishlisted={wishlistIds.has(String(book.id))}
                onToggleWishlist={(nextWishlisted) => {
                  setWishlistIds((prev) => {
                    const next = new Set(prev);
                    const bookId = String(book.id);
                    if (nextWishlisted) {
                      next.add(bookId);
                    } else {
                      next.delete(bookId);
                    }
                    return next;
                  });
                }}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))
          )}
        </section>

        {hasMoreBooks ? (
          <div className="discover-page-load-more-wrap">
            <Button
              type="button"
              variant="terracotta"
              className="discover-page-load-more"
              onClick={() =>
                setVisibleCount((c) =>
                  Math.min(c + DISCOVER_LOAD_MORE_STEP, filteredBooks.length),
                )
              }
            >
              Load more ({filteredBooks.length - visibleCount} left)
            </Button>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
