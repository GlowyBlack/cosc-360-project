import "./AddNewBookForm.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { authHeader } from "../../config/api.js";

function AddNewBookForm() {
  const navigate = useNavigate();
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookImage, setBookImage] = useState("");
  const [genre, setGenre] = useState("Fiction");
  const [conditionValue, setConditionValue] = useState(3);
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const conditionMap = {
    1: "Worn",
    2: "Fair",
    3: "Good",
    4: "Like New",
    5: "New",
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        book_title: bookTitle.trim(),
        book_author: bookAuthor.trim(),
        book_image: bookImage.trim(),
        genre,
        description: description.trim(),
        condition: conditionMap[conditionValue],
        is_available: isAvailable,
      };

      const response = await fetch(`${API}/books`, {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message = errorPayload?.message ?? "Could not create book";
        throw new Error(message);
      }

      navigate("/library");
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="add-book-page">
      <div className="top-bar">
        <button
          type="button"
          className="back-arrow"
          onClick={() => navigate("/library")}
        >
          ← Add New Book
        </button>
        <h2>Add New Book</h2>
      </div>

      <form className="add-book-card" onSubmit={handleSubmit}>
        <div className="cover-section">
          <label className="field-label">Book Cover</label>

          <div className="upload-box">
            <input
              type="url"
              value={bookImage}
              onChange={(e) => setBookImage(e.target.value)}
              placeholder="Paste cover image URL"
            />
            <p>JPG or PNG, up to 5 MB</p>
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Book Title</label>
          <input
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Enter book title"
            required
          />
        </div>

        <div className="form-group">
          <label className="field-label">Author</label>
          <input
            type="text"
            value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)}
            placeholder="Enter author name"
            required
          />
        </div>

        <div className="form-group">
          <label className="field-label">Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option>Fiction</option>
            <option>Non-Fiction</option>
            <option>Sci-Fi</option>
            <option>Fantasy</option>
            <option>Mystery</option>
            <option>Biography</option>
            <option>Romance</option>
            <option>Action</option>
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">
            Condition: {conditionMap[conditionValue]}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={conditionValue}
            onChange={(e) => setConditionValue(Number(e.target.value))}
          />
          <div className="condition-labels">
            <span>Worn</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Like New</span>
            <span>New</span>
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell others about this book..."
          />
        </div>

        <div className="borrow-section">
          <div>
            <p className="borrow-title">Available for borrowing</p>
            <p className="borrow-subtext">
              Make this book available immediately
            </p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <button
          type="submit"
          className="submit-book-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Book..." : "Add Book"}
        </button>
        {submitError ? (
          <p className="submit-book-error">{submitError}</p>
        ) : null}
      </form>
    </section>
  );
}

export default AddNewBookForm;
