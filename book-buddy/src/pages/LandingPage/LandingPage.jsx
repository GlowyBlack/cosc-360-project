import { useState } from "react";
import { API_BASE_URL } from "../../config/api.js";
import PopularList from "../../components/PopularCard/PopularList.jsx";
import Header from "../../components/Header/Header.jsx";
import API, { authHeader } from "../../api.js";

function LandingPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const books = [
    {
      title: "The Three-Body Problem",
      author: "Cixin Liu",
      distance: "1.2",
      image:
        "https://m.media-amazon.com/images/I/91DUejN+hAL._AC_UF1000,1000_QL80_.jpg",
    },
    {
      title: "The Way of Kings",
      author: "Brandon Sanderson",
      distance: "2.4",
      image:
        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1659905828i/7235533.jpg",
    },
    {
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
      distance: "0.8",
      image: "https://m.media-amazon.com/images/I/91HY8gaU8pL.jpg",
    },
    {
      title: "The Fellowship of the Ring",
      author: "J.R.R. Tolkien",
      distance: "3.1",
      image:
        "https://m.media-amazon.com/images/I/71Ep7UNeTtL._AC_UF1000,1000_QL80_.jpg",
    },
  ];

  async function handleSearch(term) {
    try {
      const response = await fetch(
        `${API}/books/search?term=${encodeURIComponent(term)}`,
        { headers: authHeader() }
      );
      if (!response.ok) {
        throw new Error("Search request failed");
      }
      const data = await response.json();
      const mapped = (data ?? []).map((book) => ({
        title: book.title,
        author: book.author,
        distance: book.distance ?? "",
        image:
          book.image ??
          "https://cdn.vectorstock.com/i/1000v/32/45/no-image-symbol-missing-available-icon-gallery-vector-45703245.jpg",
      }));
      setSearchResults(mapped);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
      setHasSearched(true);
    }
  }

  const displayBooks = hasSearched ? searchResults : books;

  return (
    <>
      <Header onSearch={handleSearch} />
      {hasSearched && searchResults.length === 0 ? (
        <p
          style={{ textAlign: "center", marginTop: "2rem", fontSize: "1.2rem" }}
        >
          No results found
        </p>
      ) : (
        <PopularList
          books={displayBooks}
          limit={hasSearched ? displayBooks.length : 4}
        />
      )}
    </>
  );
}

export default LandingPage;
