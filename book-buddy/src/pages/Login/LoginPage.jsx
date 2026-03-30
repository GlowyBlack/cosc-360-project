import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api.js";
import "../Register/Register.css";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Login failed");
      }

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      } else {
        throw new Error("No access token in response");
      }

      navigate("/library");
    } catch (err) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="register-page-wrapper">
      <div className="register-container">
        <h1>Login</h1>
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p style={{ color: "#c0392b", marginTop: 0 }}>{error}</p> : null}

          <button className="login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link to="/auth">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
