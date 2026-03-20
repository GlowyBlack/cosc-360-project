import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LibraryBookCard from "../../components/Library/LibraryBookCard.jsx";
import "./YourLibraryPage.css";

const fallbackLibraryBooks = [
  {
    id: 1,
    title: "The Three-Body Problem",
    author: "Cixin Liu",
    availability: "Available",
    image: "https://m.media-amazon.com/images/I/91DUejN+hAL._AC_UF1000,1000_QL80_.jpg",
    type: "myBooks",
  },
  {
    id: 2,
    title: "The Way of Kings",
    author: "Brandon Sanderson",
    availability: "Available",
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1659905828i/7235533.jpg",
    type: "myBooks",
  },
  {
    id: 3,
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    availability: "Borrowed",
    image: "https://m.media-amazon.com/images/I/91HY8gaU8pL.jpg",
    type: "myBooks",
  },
  {
    id: 4,
    title: "The Fellowship of the Ring",
    author: "J.R.R. Tolkien",
    availability: "Available",
    image: "https://m.media-amazon.com/images/I/71Ep7UNeTtL._AC_UF1000,1000_QL80_.jpg",
    type: "myBooks",
  },
  {
    id: 5,
    title: "Project Hail Mary",
    author: "Andy Weir",
    availability: "Borrowed",
    image: "https://m.media-amazon.com/images/I/81zD9kaVW9L.jpg",
    type: "borrowed",
  },
  {
    id: 6,
    title: "Dune",
    author: "Frank Herbert",
    availability: "Borrowed",
    image: "https://m.media-amazon.com/images/I/91A0-NmQ9UL.jpg",
    type: "borrowed",
  },
  {
    id: 7,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    availability: "Borrowed",
    image: "https://m.media-amazon.com/images/I/91b0C2YNSrL.jpg",
    type: "borrowed",
  },
  {
    id: 8,
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    availability: "Borrowed",
    image: "https://m.media-amazon.com/images/I/81IhF6CYRUL.jpg",
    type: "borrowed",
  },
  {
    id: 9,
    title: "Atomic Habits",
    author: "James Clear",
    availability: "Exchange pending",
    image: "https://m.media-amazon.com/images/I/81F90H7hnML.jpg",
    type: "exchanges",
  },
  {
    id: 10,
    title: "Circe",
    author: "Madeline Miller",
    availability: "Exchange pending",
    image: "https://m.media-amazon.com/images/I/81gxQh0FG2L.jpg",
    type: "exchanges",
  },
  {
    id: 11,
    title: "Normal People",
    author: "Sally Rooney",
    availability: "Exchange pending",
    image: "https://m.media-amazon.com/images/I/71KrM90k0IL.jpg",
    type: "exchanges",
  },
  {
    id: 12,
    title: "The Midnight Library",
    author: "Matt Haig",
    availability: "Exchange pending",
    image: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
    type: "exchanges",
  },
];

const tabs = [
  { key: "myBooks", label: "My Books" },
  { key: "borrowed", label: "Borrowed" },
  { key: "exchanges", label: "Exchanges" },
];

function YourLibraryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("myBooks");
  const [libraryBooks, setLibraryBooks] = useState(fallbackLibraryBooks);

  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

  const mapDbTypeToTab = (book) => {
    const rawType = String(
      book.type ?? book.listType ?? book.category ?? book.bucket ?? ""
    ).toLowerCase();
    const rawStatus = String(book.status ?? book.availability ?? "").toLowerCase();

    if (rawType.includes("exchange") || rawStatus.includes("exchange")) return "exchanges";
    if (rawType.includes("borrow") || rawStatus.includes("borrow")) return "borrowed";
    return "myBooks";
  };

  const mapDbBook = (book, index) => ({
    id: book.id ?? book._id ?? `db-book-${index}`,
    title: book.title ?? book.book_title ?? "Untitled Book",
    author: book.author ?? book.book_author ?? "Unknown Author",
    availability:
      (typeof book.is_available === "boolean"
        ? book.is_available
          ? "Available"
          : "Unavailable"
        : null) ??
      book.availability ??
      book.status ??
      "Available",
    image: book.image ?? book.coverImage ?? book.book_image ?? "",
    type: mapDbTypeToTab(book),
  });

  useEffect(() => {
    async function loadLibraryBooks() {
      try {
        const response = await fetch(`${baseUrl}/books`);
        if (!response.ok) return;

        const payload = await response.json();
        const rawBooks = Array.isArray(payload) ? payload : payload.books;
        if (!Array.isArray(rawBooks) || rawBooks.length === 0) return;

        setLibraryBooks(rawBooks.map(mapDbBook));
      } catch {
        // Keep fallback UI data when API is unavailable.
      }
    }

    loadLibraryBooks();
  }, [baseUrl]);

  const counts = useMemo(
    () => ({
      myBooks: libraryBooks.filter((book) => book.type === "myBooks").length,
      borrowed: libraryBooks.filter((book) => book.type === "borrowed").length,
      exchanges: libraryBooks.filter((book) => book.type === "exchanges").length,
    }),
    [libraryBooks]
  );

  const visibleBooks = useMemo(
    () => libraryBooks.filter((book) => book.type === activeTab),
    [activeTab, libraryBooks]
  );

  return (
    <main className="your-library-page">
      <section className="your-library-header">
        <h1>My Library</h1>
        <div className="library-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`library-tab ${activeTab === tab.key ? "active" : ""}`}
            >
              <span>{tab.label}</span>
              <strong>{counts[tab.key]}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="your-library-content">

        {activeTab === "myBooks" && (
          <button
            type="button"
            className="add-book-cta"
            onClick={() => navigate("/add-book")}
          >
            + Add New Book
          </button>
        )}

        <div className="library-book-grid">
          {visibleBooks.map((book) => (
            <LibraryBookCard
              key={book.id}
              title={book.title}
              author={book.author}
              availability={book.availability}
              image={book.image}
              showEdit={activeTab === "myBooks"}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default YourLibraryPage;
