function BookPreviewCard() {
  return (
    <article className="book-preview">
      <div className="book-preview__cover">
        <h2>Book Cover</h2>
      </div>

      <div className="book-preview__info">
        <p className="title">Book Title</p>
        <p className="author">Book Author</p>

        <div className="distance">
          <span className="pin">📍</span>
          <span>Distance</span>
        </div>
      </div>
    </article>
  );
}

export default BookPreviewCard;