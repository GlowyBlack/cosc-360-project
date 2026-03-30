import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./Footer.css";

export default function Footer({ year = new Date().getFullYear() }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-copy">
          Â© {year} Book Buddy.
        </p>
        <div className="footer-icons">
          <a className="footer-icon-link" href="#" aria-label="Language">
            <MaterialIcon name="language" className="footer-icon" />
          </a>
          <a className="footer-icon-link" href="#" aria-label="Contact">
            <MaterialIcon name="mail" className="footer-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}