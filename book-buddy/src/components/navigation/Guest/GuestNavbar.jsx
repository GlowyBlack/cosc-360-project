import { Link } from "react-router-dom";
import MaterialIcon from "../../MaterialIcon/MaterialIcon.jsx";
import "./GuestNavbar.css";

const defaultLinks = [
  { to: "/", label: "Discover" },
  { to: "/browse", label: "Browse" },
  { to: "/blogs", label: "Blog" },
  { to: "/about", label: "About" },
];

export default function GuestNavbar({
  links = defaultLinks,
  loginTo = "/login",
  onSearchClick,
}) {
  return (
    <nav className="guest-navbar" aria-label="Main">
      <div className="guest-navbar-left">
        <Link to="/" className="guest-navbar-logo">
          BookBuddy
        </Link>
        <div className="guest-navbar-links">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} className="guest-navbar-link">
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="guest-navbar-right">
        <button
          type="button"
          className="guest-navbar-icon-btn"
          aria-label="Search"
          onClick={onSearchClick}
        >
          <MaterialIcon name="search" />
        </button>
        <Link to={loginTo} className="guest-navbar-login-btn">
          Login
        </Link>
      </div>
    </nav>
  );
}
