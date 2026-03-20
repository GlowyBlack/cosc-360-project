import "./LibraryBookCard.css";

function LibraryBookCard({ title, author, availability, image, showEdit = false }) {
  return (
    <article className="library-book-card">
      <div className="library-book-card-image-wrap">
        {image ? (
          <img className="library-book-card-image" src={image} alt={`${title} cover`} />
        ) : null}
      </div>

      <div className="library-book-card-info">
        <h3>{title}</h3>
        <p>{author}</p>
        <p className="library-book-card-availability">{availability}</p>
      </div>

      {showEdit && (
        <button type="button" className="library-book-card-edit-btn">
          Edit
        </button>
      )}
    </article>
  );
}

export default LibraryBookCard;
