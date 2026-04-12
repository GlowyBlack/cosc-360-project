import { Link, useLocation } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import "../../components/Button/Button.css";
import { useAuth } from "../../context/AuthContext.jsx";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const inAdmin = pathname.startsWith("/admin");

  const body = (
    <main className="not-found-main" role="main">
      <div className="not-found-card">
        <div className="not-found-icon" aria-hidden>
          <MaterialIcon name="travel_explore" />
        </div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-lede">
          This path does not exist or may have been moved. Head back to Discover to keep
          exploring books.
        </p>
        <Link to="/" className="btn btn-primary not-found-btn">
          Back to Discover
        </Link>
      </div>
    </main>
  );

  if (inAdmin) {
    return (
      <div className="not-found-page not-found-page--admin">
        <div className="not-found-admin-inner">{body}</div>
      </div>
    );
  }

  return (
    <div className="not-found-page">
      <Header variant={user ? "user" : "guest"} />
      {body}
      <Footer />
    </div>
  );
}
