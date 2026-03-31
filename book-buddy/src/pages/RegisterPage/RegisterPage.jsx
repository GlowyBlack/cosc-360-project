import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import RegisterForm from "../../components/RegisterForm/RegisterForm.jsx";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister({ firstName, lastName, email, password }) {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(firstName || "").trim(),
          lastName: String(lastName || "").trim(),
          email: String(email || "").trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Registration failed");
      }

      navigate("/login");
    } catch (e) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <Header variant="guest" />
      <main className="register-page-main">
        <RegisterForm
          onSubmit={handleRegister}
          error={error}
          isSubmitting={isSubmitting}
          loginHref="/login"
          backHref="/"
        />
      </main>
      <Footer year={2026} />
    </div>
  );
}
