import { useState } from "react";
import "./Header.css";

function Header({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSearch?.(searchTerm.trim());
    setSearchTerm("");
  }

  return (
    <div id="header">
      <h1 id="title">Explore Books</h1>
      <h2 id="subtitle">Discover books near you</h2>
      <form className="search-container" onSubmit={handleSubmit}>
        <input
          type="text"
          id="search-bar"
          placeholder="Search books, authors, genres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
    </div>
  );
}

export default Header;