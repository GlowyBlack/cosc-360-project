# Admin API endpoints (backend todo)

Some routes are implemented; others are still future work for the dashboard and reports UI.

## Implemented (users / books)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/users` | List all users. |
| `GET` | `/admin/books` | List all books. |
| `GET` | `/admin/users/search?q=` | Search users (and owners by book title/author). |
| `PUT` | `/admin/users/:id/suspend` | Suspend user. |
| `PUT` | `/admin/users/:id/unsuspend` | Unsuspend user. |
| `PUT` | `/admin/users/:id/ban` | Ban user. |
| `PUT` | `/admin/users/:id/unban` | Unban user (`isBanned: false`). `DELETE` on books also available. |

## Needed for full dashboard parity (reference UI)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/stats/borrows` or `GET /admin/stats` | **Active borrows** count (and optionally trend % vs prior period). |
| `GET` | `/admin/stats/trends` | Optional: listing/user **trend** percentages for metric cards (e.g. `~12%`). |
| `GET` | `/admin/reports/pending` | **Pending investigations** table: paginated rows with reporter, reported entity, reason, date, status, actions. |
| `GET` | `/admin/reports/pending/export` | **Export CSV** for pending reports (or `POST` with filters). |

## Reports / moderation (future pages)

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/admin/reports/:id` | Update report status, resolve. |
| `DELETE` | `/admin/reports/:id` | Delete or archive report. |

## Notes

- Secure all `/admin/*` routes with authentication and **Admin** role checks.
- Align response shapes with table columns: reporter profile, entity type (listing/user), reason code, timestamps, status.
