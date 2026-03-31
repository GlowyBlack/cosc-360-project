import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import RegisterForm from "../../components/RegisterForm/RegisterForm.jsx";
import "./RegisterPage.css";

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RegisterPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="register-page">
      <Header variant="guest" />
      <main className="register-page-main">
        <RegisterForm
          loginHref="/login"
          backHref="/"
        />
      </main>
      <Footer year={2026} />
    </div>
  );
}
