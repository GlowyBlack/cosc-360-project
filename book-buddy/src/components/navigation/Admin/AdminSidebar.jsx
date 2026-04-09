import { NavLink } from "react-router-dom";
import MaterialIcon from "../../MaterialIcon/MaterialIcon.jsx";
import "./AdminSidebar.css";

const items = [
  { to: "/", label: "Back to Discover", icon: "travel_explore", end: true },
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/users", label: "User Management", icon: "group" },
  { to: "/admin/listings", label: "Listings Management", icon: "inventory_2" },
  { to: "/admin/posts", label: "Posts Management", icon: "feed" },
  { to: "/admin/comments", label: "Comments Management", icon: "mode_comment" },
  { to: "/admin/reports", label: "Reports", icon: "assessment" },
];

export default function AdminSidebar({ onLogout }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-name">BookBuddy</span>
        <span className="admin-sidebar-brand-suffix"> Admin</span>
        <p className="admin-sidebar-title">System Control</p>
      </div>
      {items.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `admin-sidebar-link ${isActive ? "admin-sidebar-link--active" : ""}`.trim()
          }
        >
          <MaterialIcon name={icon} className="admin-sidebar-link-icon" />
          {label}
        </NavLink>
      ))}
      <button
        type="button"
        className="admin-sidebar-logout"
        onClick={() => {
          if (typeof onLogout === "function") onLogout();
        }}
      >
        <MaterialIcon name="logout" className="admin-sidebar-link-icon" />
        Logout
      </button>
    </aside>
  );
}
