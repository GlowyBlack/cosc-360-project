import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
// import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registering, setRegistering] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Registration failed");
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRegistering(false);
    } catch (err) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
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

  function switchForm() {
    setRegistering(!registering);
    setError("");
  }

  return (
    <>
      <div className="register-page-wrapper">
        {registering ? (
          <div className="register-container">
            <h1>Create an Account</h1>
            <form className="form-card" onSubmit={handleRegisterSubmit}>
              <div className="name-row">
                <div className="input-group">
                  <label htmlFor="reg-first-name">First Name</label>
                  <input
                    id="reg-first-name"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="reg-last-name">Last Name</label>
                  <input
                    id="reg-last-name"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  placeholder="Enter email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p style={{ color: "#c0392b", marginTop: 0 }}>{error}</p>
              ) : null}

              <button
                className="create-btn"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating…" : "Create Account"}
              </button>
              <button
                className="login-btn"
                type="button"
                onClick={switchForm}
                disabled={isSubmitting}
              >
                Log In
              </button>
            </form>
          </div>
        ) : (
          <div className="register-container">
            <h1>Login</h1>

            <form className="form-card" onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label htmlFor="auth-login-email">Email</label>
                <input
                  id="auth-login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="auth-login-password">Password</label>
                <input
                  id="auth-login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p style={{ color: "#c0392b", marginTop: 0 }}>{error}</p>
              ) : null}

              <button
                className="login-btn"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in…" : "Sign In"}
              </button>
              <button
                className="create-btn"
                type="button"
                onClick={switchForm}
                disabled={isSubmitting}
              >
                Create a New Account
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default Register;
