import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import BookForm from "../../components/BookForm/BookForm.jsx";
import API, { authHeader } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../AddBookPage/AddBookPage.css";

export default function EditBookPage() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      if (
        !bookId ||
        !/^[a-f\d]{24}$/i.test(String(bookId).trim())
      ) {
        setLoadError("Invalid book link.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API}/books/${encodeURIComponent(bookId)}`, {
          headers: { ...authHeader() },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data.message ??
              data.detail ??
              data.error ??
              `Failed to load book (${response.status})`,
          );
        }
        if (!cancelled) setBook(data);
      } catch (e) {
        if (!cancelled) setLoadError(e.message ?? "Failed to load book");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const initialValues = useMemo(() => {
    if (!book) return null;
    return {
      title: book.bookTitle ?? "",
      author: book.bookAuthor ?? "",
      genres: Array.isArray(book.genre) ? [...book.genre] : [],
      condition: book.condition ?? "",
      description: book.description ?? "",
      ownerNote: book.ownerNote ?? "",
      image: null,
    };
  }, [book]);

  if (!user) return <Navigate to="/login" replace />;

  const handleUpdate = async (values) => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        bookTitle: values.title.trim(),
        bookAuthor: values.author.trim(),
        genre: Array.isArray(values.genres) ? values.genres : [],
        condition: values.condition,
        description: values.description.trim(),
        ownerNote: values.ownerNote.trim(),
        isAvailable: book?.isAvailable !== false,
      };
      payload.bookImage = "";

      const response = await fetch(`${API}/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          data.message ??
          data.detail ??
          data.error ??
          `Could not update book (${response.status})`;
        throw new Error(msg);
      }

      navigate("/library", { replace: true });
    } catch (e) {
      setError(e.message ?? "Failed to update book");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-book-page">
      <Header variant="user" />
      <main className="add-book-page-main">
        <header className="add-book-page-intro">
          <p className="add-book-page-kicker">Edit listing</p>
          <h1 className="add-book-page-title">Update book details</h1>
        </header>

        {loadError ? (
          <p className="add-book-page-error">{loadError}</p>
        ) : null}
        {error ? <p className="add-book-page-error">{error}</p> : null}

        {loading ? (
          <p className="library-page-state">Loading book…</p>
        ) : null}

        {!loading && !loadError && initialValues ? (
          <BookForm
            key={bookId}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={submitting ? "Saving…" : "Save changes"}
            onSubmit={handleUpdate}
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}