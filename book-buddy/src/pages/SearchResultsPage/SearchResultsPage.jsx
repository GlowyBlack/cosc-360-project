import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import BookCard from "../../components/BookCard/BookCard.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import Button from "../../components/Button/Button.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API from "../../config/api.js";
import { toDiscoverCardBook } from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./SearchResultsPage.css";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const [query, setQuery] = useState(q);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!q) {
      setBooks([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      setBooks([]);
      try {
        const response = await fetch(
          `${API}/books/search?q=${encodeURIComponent(q)}`,
        );
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(
            data.message ?? data.detail ?? `Search failed (${response.status})`,
          );
        }
        if (!cancelled) {
          setBooks(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? "Search failed");
          setBooks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const cardBooks = useMemo(() => books.map(toDiscoverCardBook), [books]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = query.trim();
    if (next) {
      setSearchParams({ q: next });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="search-results-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="search-results-page-main">
        <header className="search-results-page-header">
          <Link className="search-results-page-back" to="/">
            <MaterialIcon name="west" className="search-results-page-back-icon" />
            <span>Back to Discover</span>
          </Link>
          <h1 className="search-results-page-title">Search</h1>
          <p className="search-results-page-lede">
            Find titles, authors, genres, and descriptions across the catalog.
          </p>
        </header>

        <form
          className="search-results-page-form"
          onSubmit={handleSubmit}
          role="search"
        >
          <TextField
            id="search-results-query"
            name="q"
            label="Search"
            type="search"
            placeholder="Search books, authors, genres…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-results-page-field"
          />
          <Button
            type="submit"
            variant="terracotta"
            className="search-results-page-submit"
          >
            <span className="search-results-page-submit-inner">
              Search
              <MaterialIcon name="search" className="search-results-page-submit-icon" />
            </span>
          </Button>
        </form>

        <section className="search-results-page-body" aria-live="polite">
          {!q ? (
            <p className="search-results-page-placeholder">
              Enter a search term above or{" "}
              <Link to="/">browse all listings</Link>.
            </p>
          ) : (
            <>
              <p className="search-results-page-query-line">
                Results for{" "}
                <span className="search-results-page-query">{q}</span>
              </p>

              {loading ? (
                <p className="search-results-page-state">Searching…</p>
              ) : null}
              {error ? (
                <p className="search-results-page-state search-results-page-state--error">
                  {error}
                </p>
              ) : null}

              {!loading && !error ? (
                cardBooks.length === 0 ? (
                  <p className="search-results-page-empty">
                    No books matched that search. Try different keywords.
                  </p>
                ) : (
                  <div
                    className="search-results-page-grid"
                    aria-label="Search results"
                  >
                    {cardBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        cover={book.cover}
                        title={book.title}
                        author={book.author}
                        owner={book.owner}
                        location={book.location}
                        status={book.status}
                        onClick={() => navigate(`/book/${book.id}`)}
                      />
                    ))}
                  </div>
                )
              ) : null}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
