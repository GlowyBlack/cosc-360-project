import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import LoginForm from "../../components/LoginForm/LoginForm.jsx";
import "./LoginPage.css";

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <Header variant="guest" />
      <main className="login-page-main">
        <LoginForm
          signUpHref="/register"
          backHref="/"
        />
      </main>
      <Footer year={2026} />
    </div>
  );
}
