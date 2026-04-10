import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import BookForm from "../../components/BookForm/BookForm.jsx";
import API, { authHeader } from "../../config/api.js";
import { createAppSocket } from "../../config/socket.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./AddBookPage.css";

const socket = createAppSocket();

export default function AddBookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const handleCreateBook = async (values) => {
    setSubmitting(true);
    setError("");
    try {
      if (!values.image) {
        throw new Error("A real book cover image is required");
      }
      const payload = new FormData();
      payload.append("bookTitle", values.title.trim());
      payload.append("bookAuthor", values.author.trim());
      payload.append("condition", values.condition);
      payload.append("description", values.description.trim());
      payload.append("ownerNote", values.ownerNote.trim());
      payload.append("isAvailable", "true");
      (Array.isArray(values.genres) ? values.genres : []).forEach((g) => payload.append("genre", g));
      payload.append("image", values.image);

      const response = await fetch(`${API}/books`, {
        method: "POST",
        headers: { ...authHeader() },
        body: payload,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          data.message ??
          data.detail ??
          data.error ??
          `Could not add book (${response.status})`;
        throw new Error(msg);
      }

      socket.emit("book_update");
      navigate("/library", { replace: true });
    } catch (e) {
      setError(e.message ?? "Failed to add book");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-book-page">
      <Header variant="user" />
      <main className="add-book-page-main">
        <header className="add-book-page-intro">
          <p className="add-book-page-kicker">Contribution</p>
          <h1 className="add-book-page-title">Add new book to the library</h1>
        </header>

        {error ? <p className="add-book-page-error">{error}</p> : null}

        <BookForm
          submitting={submitting}
          submitLabel={submitting ? "Listing…" : "List Book"}
          onSubmit={handleCreateBook}
        />
      </main>
      <Footer />
    </div>
  );
}