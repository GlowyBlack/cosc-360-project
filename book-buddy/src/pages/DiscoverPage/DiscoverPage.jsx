import { useMemo, useState, useEffect } from "react";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import BookCard from "../../components/BookCard/BookCard.jsx";
import { DISCOVER_FILTERS } from "../../data/discoverBooks.js";
import { API_BASE_URL } from "../../config/api.js";

import "./DiscoverPage.css";

function toCardBook(raw) {
  const id =
    raw._id != null ? String(raw._id) : raw.id != null ? String(raw.id) : "";
  const title = raw.bookTitle ?? raw.title ?? "Untitled";
  const author = raw.bookAuthor ?? raw.author ?? "Unknown author";
  const imageUrl = raw.bookImage ?? raw.cover?.src ?? null;
  const cover = {
    src:
      imageUrl ||
      `https://picsum.photos/seed/${encodeURIComponent(id || title)}/220/330`,
    alt: imageUrl ? `Cover: ${title}` : "",
  };
  const status =
    raw.status ??
    (raw.isAvailable === true
      ? "Available"
      : raw.isAvailable === false
        ? "Unavailable"
        : "Available");
  let owner = raw.owner;
  if (owner == null && raw.bookOwner != null) {
    if (typeof raw.bookOwner === "object") {
      owner =
        raw.bookOwner.username ??
        raw.bookOwner.name ??
        "Community member";
    } else {
      owner = "Community member";
    }
  }
  return {
    id,
    title,
    author,
    owner: owner ?? "Community member",
    location: raw.location ?? null,
    genre: raw.genre ?? null,
    status,
    cover,
  };
}

export default function DiscoverPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [books, setBooks] = useState([]);

  const cardBooks = useMemo(() => books.map(toCardBook), [books]);

  const filteredBooks = useMemo(() => {
    if (activeFilter === "All") return cardBooks;
    return cardBooks.filter((b) => b.genre === activeFilter);
  }, [activeFilter, cardBooks]);

  useEffect(()=> {
    async function loadBooks(params) {
      try{
        const response = await fetch(`${API_BASE_URL}/books/`);
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
      }catch(error){
        console.log(error)
      }
    }

    loadBooks();
  }, []);

  return (
    <div className="discover-page">
      <Header variant="guest" />
      <main className="discover-page-main">
        <header className="discover-page-intro">
          <h1 className="discover-page-title">Discover</h1>
          <p className="discover-page-lede">
            Browse books shared by readers near you. Filter by genre to find
            your next swap.
          </p>
        </header>

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
                cover={book.cover}
                title={book.title}
                author={book.author}
                owner={book.owner}
                location={book.location}
                status={book.status}
              />
            ))
          )}
        </section>
      </main>
      <Footer year={2026} />
    </div>
  );
}