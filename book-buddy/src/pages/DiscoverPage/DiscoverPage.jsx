import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import BookCard from "../../components/BookCard/BookCard.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import Button from "../../components/Button/Button.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { DISCOVER_FILTERS } from "../../data/discoverBooks.js";

import API from "../../config/api.js";
import {
  bookGenreMatchesFilter,
  toDiscoverCardBook,
} from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";

import "./DiscoverPage.css";

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const cardBooks = useMemo(() => books.map(toDiscoverCardBook), [books]);

  const filteredBooks = useMemo(() => {
    if (activeFilter === "All") return cardBooks;
    return cardBooks.filter((b) =>
      bookGenreMatchesFilter(b.genre, activeFilter),
    );
  }, [activeFilter, cardBooks]);

  useEffect(() => {
    async function loadBooks() {
      try {
        const response = await fetch(`${API}/books/`);
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log(error);
      }
    }

    loadBooks();
  }, []);

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
              onClick={() => setActiveFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>

        <section
          className="discover-page-grid"
          aria-label="Book listings"
        >
          {filteredBooks.length === 0 ? (
            <p className="discover-page-empty">
              No books in this genre yet. Try another filter.
            </p>
          ) : (
            filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                cover={book.cover}
                title={book.title}
                author={book.author}
                owner={book.owner}
                location={book.location}
                status={book.status}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
