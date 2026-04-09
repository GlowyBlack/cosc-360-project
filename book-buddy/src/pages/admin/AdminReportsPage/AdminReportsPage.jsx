import "./admin-shared.css";
import "./AdminReportsPage.css";

export default function AdminReportsPage() {
  return (
    <div className="admin-page admin-reports">
      <header className="admin-reports__header">
        <h1 className="admin-reports__title">Reports</h1>
        <p className="admin-reports__lede">
          Moderation queue and export will appear here once reporting APIs are
          available. See <code>docs/admin-endpoints-todo.md</code> for{" "}
          <code>GET /admin/reports/pending</code> and related routes.
        </p>
      </header>
      <div className="admin-reports__placeholder">
        <p>No report data yet.</p>
      </div>
    </div>
  );
}
