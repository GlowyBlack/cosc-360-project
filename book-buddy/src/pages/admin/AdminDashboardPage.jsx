import { useEffect, useState } from "react";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader } from "../../config/api.js";
import "./AdminDashboardPage.css";

/**
 * Metrics: GET /admin/users, GET /admin/users (counts).
 * Trends, borrows, investigations table: see docs/admin-endpoints-todo.md
 */
export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [uRes, bRes] = await Promise.all([
          fetch(`${API}/admin/users`, { headers: { ...authHeader() } }),
          fetch(`${API}/admin/books`, { headers: { ...authHeader() } }),
        ]);
        if (!uRes.ok) {
          const err = await uRes.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load users");
        }
        if (!bRes.ok) {
          const err = await bRes.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load books");
        }
        const uData = await uRes.json().catch(() => []);
        const bData = await bRes.json().catch(() => []);
        if (!cancelled) {
          setUsers(Array.isArray(uData) ? uData : []);
          setBooks(Array.isArray(bData) ? bData : []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsers = users.length;
  const totalListings = books.length;
  const activeBorrows = null;
  const flaggedReports = null;

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <h1 className="admin-dashboard__title">Executive Overview</h1>
          <p className="admin-dashboard__subtitle">
            Monitoring the status of BookBuddy&apos;s site.
          </p>
        </div>
        <div className="admin-dashboard__avatar" aria-hidden>
          <MaterialIcon name="person" />
        </div>
      </header>

      {error ? (
        <p className="admin-dashboard__error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="admin-dashboard__stats" aria-label="Key metrics">
        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <MaterialIcon name="menu_book" className="admin-stat-card__icon" />
            <span className="admin-stat-card__trend admin-stat-card__trend--muted">
              —
            </span>
          </div>
          <p className="admin-stat-card__label">Total listings</p>
          <p className="admin-stat-card__value">
            {loading ? "…" : totalListings.toLocaleString()}
          </p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <MaterialIcon name="group" className="admin-stat-card__icon" />
            <span className="admin-stat-card__trend admin-stat-card__trend--muted">
              —
            </span>
          </div>
          <p className="admin-stat-card__label">Total users</p>
          <p className="admin-stat-card__value">
            {loading ? "…" : totalUsers.toLocaleString()}
          </p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <MaterialIcon name="swap_horiz" className="admin-stat-card__icon" />
            <span className="admin-stat-card__trend admin-stat-card__trend--muted">
              Stable
            </span>
          </div>
          <p className="admin-stat-card__label">Active borrows</p>
          <p className="admin-stat-card__value">
            {activeBorrows == null ? "—" : String(activeBorrows)}
          </p>
        </article>

        <article className="admin-stat-card admin-stat-card--inverted">
          <div className="admin-stat-card__top">
            <MaterialIcon
              name="flag"
              className="admin-stat-card__icon admin-stat-card__icon--on-dark"
            />
            <span className="admin-stat-card__pill">Urgent</span>
          </div>
          <p className="admin-stat-card__label admin-stat-card__label--on-dark">
            Flagged reports
          </p>
          <p className="admin-stat-card__value admin-stat-card__value--on-dark">
            {flaggedReports == null ? "—" : String(flaggedReports)}
          </p>
        </article>
      </section>

      <section
        className="admin-dashboard__panel"
        aria-labelledby="pending-investigations-heading"
      >
        <div className="admin-dashboard__panel-head">
          <h2 id="pending-investigations-heading" className="admin-dashboard__panel-title">
            Pending Investigations
          </h2>
          <div className="admin-dashboard__panel-actions">
            <button type="button" className="admin-btn admin-btn--outline" disabled>
              Export CSV
            </button>
            <button type="button" className="admin-btn admin-btn--solid" disabled>
              Review all
            </button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Reported entity</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="admin-dashboard__table-foot">
          <span className="admin-dashboard__table-meta">
            Showing 0 of 0 flagged items
          </span>
          <span className="admin-dashboard__pager">
            <button type="button" disabled>
              Previous
            </button>
            {" · "}
            <button type="button" disabled>
              Next
            </button>
          </span>
        </div>
      </section>

      <footer className="admin-dashboard__footer">
        <p className="admin-dashboard__footer-copy">
          © {new Date().getFullYear()} BookBuddy admin. Hand-curated for readers.
        </p>
        <div className="admin-dashboard__footer-links">
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">System terms</a>
          <a href="/contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}
