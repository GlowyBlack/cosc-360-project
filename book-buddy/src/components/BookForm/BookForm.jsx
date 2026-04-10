import { useState, useEffect } from "react";
import TextField from "../TextField/TextField.jsx";
import Button from "../Button/Button.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import API from "../../config/api.js";
import { FALLBACK_BOOK_COVER_IMAGE } from "../../config/images.js";
import "./BookForm.css";

const CONDITION_OPTIONS = ["New", "Like New", "Good", "Fair", "Worn"];

const empty = {
  title: "",
  author: "",
  genres: [],
  condition: "",
  description: "",
  ownerNote: "",
  image: null,
};

function buildInitialGenreValues(initialValues) {
  const merged = { ...empty, ...initialValues };
  if (Array.isArray(initialValues?.genres)) {
    merged.genres = [...initialValues.genres];
  } else if (initialValues?.genre != null && initialValues.genre !== "") {
    merged.genres = Array.isArray(initialValues.genre)
      ? [...initialValues.genre]
      : String(initialValues.genre)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  } else {
    merged.genres = [];
  }
  return merged;
}

export default function BookForm({
  initialValues = empty,
  onSubmit,
  submitLabel = "Save",
  submitting = false,
  existingImageUrl = "",
}) {
  const [values, setValues] = useState(() => buildInitialGenreValues(initialValues));
  const [errors, setErrors] = useState({});
  const [genreOptions, setGenreOptions] = useState([]);
  const cleanExistingImageUrl = String(existingImageUrl ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    async function loadGenres() {
      try {
        const response = await fetch(`${API}/books/meta/genres`);
        const data = await response.json().catch(() => ({}));
        if (!cancelled && Array.isArray(data.genres)) {
          setGenreOptions(data.genres);
        }
      } catch {
        if (!cancelled) setGenreOptions([]);
      }
    }
    loadGenres();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key) => (e) => {
    const v = e.target.value;
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const toggleGenre = (name) => {
    setValues((prev) => {
      const has = prev.genres.includes(name);
      const genres = has
        ? prev.genres.filter((g) => g !== name)
        : [...prev.genres, name];
      return { ...prev, genres };
    });
  };

  const validate = () => {
    const e = {};
    if (!values.title.trim()) e.title = "Title is required";
    if (!values.author.trim()) e.author = "Author is required";
    if (!values.genres?.length) e.genres = "Select at least one genre";
    if (!values.condition.trim()) e.condition = "Condition is required";
    if (!values.description.trim()) e.description = "Book summary is required";
    const fallbackUrl = String(FALLBACK_BOOK_COVER_IMAGE ?? "").trim();
    const noNewImage = !values.image;
    const noExistingImage = !cleanExistingImageUrl || cleanExistingImageUrl === fallbackUrl;
    if (noNewImage && noExistingImage) {
      e.image = "A real book cover image is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (typeof onSubmit === "function") onSubmit(values);
  };

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      <div className="book-form-field">
        <p className="book-form-label">Cover Image</p>
        <label className="book-form-upload" htmlFor="book-image">
          {cleanExistingImageUrl ? (
            <img
              src={cleanExistingImageUrl}
              alt="Current book cover"
              className="book-form-upload-preview"
            />
          ) : null}
          <span className="book-form-upload-icon-wrap" aria-hidden>
            <MaterialIcon name="add_a_photo" className="book-form-upload-icon" />
          </span>
          <span className="book-form-upload-title">
            {values.image ? values.image.name : "Drag and drop cover"}
          </span>
          <span className="book-form-upload-subtitle">
            {values.image ? "Click to replace file" : "or click to browse files"}
          </span>
        </label>
        <input
          id="book-image"
          name="image"
          type="file"
          accept="image/*"
          className="book-form-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setValues((prev) => ({ ...prev, image: file }));
          }}
        />
      </div>
      {errors.image && <p className="book-form-error">{errors.image}</p>}

      <TextField
        id="book-title"
        name="title"
        label="Title"
        placeholder="e.g. The Great Gatsby"
        value={values.title}
        onChange={set("title")}
        required
      />
      {errors.title && <p className="book-form-error">{errors.title}</p>}
      <TextField
        id="book-author"
        name="author"
        label="Author"
        placeholder="e.g. F. Scott Fitzgerald"
        value={values.author}
        onChange={set("author")}
        required
      />
      {errors.author && <p className="book-form-error">{errors.author}</p>}
      <fieldset className="book-form-fieldset">
        <legend className="book-form-label">Genres</legend>
        <p className="book-form-hint" id="book-genres-hint">
          Select all that apply (from the catalog).
        </p>
        <div
          className="book-form-genre-grid"
          role="group"
          aria-describedby="book-genres-hint"
        >
          {genreOptions.map((g) => (
            <label key={g} className="book-form-genre-option">
              <input
                type="checkbox"
                name="genres"
                value={g}
                checked={values.genres.includes(g)}
                onChange={() => toggleGenre(g)}
              />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {errors.genres && <p className="book-form-error">{errors.genres}</p>}
      <fieldset className="book-form-fieldset">
        <legend className="book-form-label">Condition</legend>
        <div className="book-form-radio-group" role="radiogroup">
          {CONDITION_OPTIONS.map((option) => (
            <label key={option} className="book-form-radio-option">
              <input
                type="radio"
                name="condition"
                value={option}
                checked={values.condition === option}
                onChange={set("condition")}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {errors.condition && <p className="book-form-error">{errors.condition}</p>}
      <div className="book-form-field">
        <label className="book-form-label" htmlFor="book-desc">
          Book summary
        </label>
        <textarea
          id="book-desc"
          name="description"
          rows={4}
          value={values.description}
          onChange={set("description")}
          className="book-form-textarea"
          placeholder="Tell readers what this book is about and why it's worth reading."
        />
      </div>
      {errors.description && (
        <p className="book-form-error">{errors.description}</p>
      )}
      <div className="book-form-field">
        <label className="book-form-label" htmlFor="book-owner-note">
          Owner note about book state
        </label>
        <textarea
          id="book-owner-note"
          name="ownerNote"
          rows={3}
          value={values.ownerNote}
          onChange={set("ownerNote")}
          className="book-form-textarea"
          placeholder="Add any useful condition notes (creases, highlights, shelf wear, etc.)."
        />
      </div>
      <Button
        variant="terracotta"
        type="submit"
        className="book-form-submit"
        disabled={submitting}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
