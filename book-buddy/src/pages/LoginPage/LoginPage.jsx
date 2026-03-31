import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import LoginForm from "../../components/LoginForm/LoginForm.jsx";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin({ email, password }) {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email || "").trim(), password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Login failed");
      }
      if (!data.access_token) {
        throw new Error("No access token in response");
      }

      localStorage.setItem("token", data.access_token);
      navigate("/library");
    } catch (e) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <Header variant="guest" />
      <main className="login-page-main">
        <LoginForm
          onSubmit={handleLogin}
          error={error}
          isSubmitting={isSubmitting}
          signUpHref="/register"
          backHref="/"
        />
      </main>
      <Footer year={2026} />
    </div>
  );
}
