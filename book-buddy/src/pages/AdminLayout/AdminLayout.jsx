import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminSidebar from "../../components/navigation/Admin/AdminSidebar.jsx";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.role !== "Admin") return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [user?.role]);

  if (!user || user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <div className="admin-layout__sidebar">
        <AdminSidebar onLogout={logout} />
      </div>
      <div className="admin-layout__main">
        <div className="admin-layout__scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
