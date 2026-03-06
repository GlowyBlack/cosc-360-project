import "./AddNewBookForm.css";

function AddNewBookForm() {
  return (
    <section className="add-book-page">
      <div className="top-bar">
        <span className="back-arrow">←</span>
        <h2>Add New Book</h2>
      </div>

      <div className="add-book-card">
        <div className="cover-section">
          <label className="field-label">Book Cover</label>

          <div className="upload-box">
            <button className="upload-btn">Upload Image</button>
            <p>JPG or PNG, up to 5 MB</p>
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Book Title</label>
          <input type="text" placeholder="Enter book title" />
        </div>

        <div className="form-group">
          <label className="field-label">Author</label>
          <input type="text" placeholder="Enter author name" />
        </div>

        <div className="form-group">
          <label className="field-label">Genre</label>
          <select>
            <option>Select genre</option>
            <option>Fiction</option>
            <option>Non-Fiction</option>
            <option>Fantasy</option>
            <option>Romance</option>
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">Condition: Good</label>
          <input type="range" min="1" max="5" defaultValue="3" />
          <div className="condition-labels">
            <span>Worn</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Like new</span>
            <span>New</span>
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Description</label>
          <textarea placeholder="Tell others about this book..." />
        </div>

        <div className="borrow-section">
          <div>
            <p className="borrow-title">Available for borrowing</p>
            <p className="borrow-subtext">Make this book available immediately</p>
          </div>

          <label className="switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </section>
  );
}

export default AddNewBookForm;