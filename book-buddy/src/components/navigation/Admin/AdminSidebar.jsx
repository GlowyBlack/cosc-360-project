import { NavLink } from "react-router-dom";
import MaterialIcon from "../../MaterialIcon/MaterialIcon.jsx";
import "./AdminSidebar.css";

const items = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/users", label: "User Management", icon: "group" },
  { to: "/admin/listings", label: "Listings", icon: "inventory_2" },
  { to: "/admin/reports", label: "Reports", icon: "assessment" },
];

export default function AdminSidebar({ onLogout }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin">
      <p className="admin-sidebar-title">Admin</p>
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
