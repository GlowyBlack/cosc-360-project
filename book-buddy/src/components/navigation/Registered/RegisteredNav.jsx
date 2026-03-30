import { NavLink, useNavigate } from "react-router-dom";
import MaterialIcon from "../../MaterialIcon/MaterialIcon.jsx";
// import { useAuth } from "../../../context/AuthContext.jsx";
import "./RegisteredNav.css";

const mainNavItems = [
  { to: "/home", label: "Home", icon: "home", badgeKey: null },
  { to: "/library", label: "My Library", icon: "menu_book", badgeKey: null },
  { to: "/messages", label: "Messages", icon: "chat_bubble", badgeKey: "messages" },
  { to: "/requests", label: "Requests", icon: "sync_alt", badgeKey: "requests" },
];

const profileNav = { to: "/profile", label: "Profile", icon: "person" };

export default function RegisteredNav({
  messageUnreadCount = 0,
  requestPendingCount = 0,
}) {
  const navigate = useNavigate();
  // const { logout } = useAuth();
  const counts = { messages: messageUnreadCount, requests: requestPendingCount };

  const handleLogout = () => {
    // logout();
    // navigate("/discover", { replace: true });
  };

  return (
    <>
      <header className="reg-nav-desktop-bar">
        <div className="reg-nav-desktop-inner">
          <div className="reg-nav-desktop-left">
            <span className="reg-nav-brand">BookBuddy</span>
            <nav className="reg-nav-desktop-nav" aria-label="Primary">
              {mainNavItems.map(({ to, label, icon, badgeKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `reg-nav-link ${isActive ? "reg-nav-link--active" : ""}`.trim()
                  }
                  end={to === "/home"}
                >
                  <span className="reg-nav-icon-wrap">
                    <MaterialIcon name={icon} className="reg-nav-icon" />
                    {badgeKey && counts[badgeKey] > 0 && (
                      <span className="reg-nav-badge">
                        {counts[badgeKey] > 99 ? "99+" : counts[badgeKey]}
                      </span>
                    )}
                  </span>
                  <span className="reg-nav-label">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="reg-nav-desktop-right">
            <NavLink
              to={profileNav.to}
              className={({ isActive }) =>
                `reg-nav-link reg-nav-link--profile ${isActive ? "reg-nav-link--active" : ""}`.trim()
              }
              aria-label={profileNav.label}
            >
              <span className="reg-nav-icon-wrap">
                <MaterialIcon name={profileNav.icon} className="reg-nav-icon" />
              </span>
            </NavLink>
            <button
              type="button"
              className="reg-nav-logout"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="reg-nav-mobile-header">
        <div className="reg-nav-mobile-row">
          <span className="reg-nav-mobile-brand">BookBuddy</span>
          <button
            type="button"
            className="reg-nav-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </div>

      <nav className="reg-nav-bottom" aria-label="Primary mobile bottom">
        <div className="reg-nav-bottom-inner">
          {mainNavItems.map(({ to, label, icon, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `reg-nav-bottom-link ${isActive ? "reg-nav-bottom-link--active" : ""}`.trim()
              }
              end={to === "/home"}
            >
              <span className="reg-nav-icon-wrap">
                <MaterialIcon name={icon} className="reg-nav-bottom-icon" />
                {badgeKey && counts[badgeKey] > 0 && (
                  <span className="reg-nav-badge-small">
                    {counts[badgeKey] > 9 ? "9+" : counts[badgeKey]}
                  </span>
                )}
              </span>
              <span className="reg-nav-bottom-label">{label.split(" ")[0]}</span>
            </NavLink>
          ))}
          <NavLink
            to={profileNav.to}
            className={({ isActive }) =>
              `reg-nav-bottom-link reg-nav-bottom-link--profile ${isActive ? "reg-nav-bottom-link--active" : ""}`.trim()
            }
            aria-label={profileNav.label}
          >
            <span className="reg-nav-icon-wrap">
              <MaterialIcon name={profileNav.icon} className="reg-nav-bottom-icon" />
            </span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
