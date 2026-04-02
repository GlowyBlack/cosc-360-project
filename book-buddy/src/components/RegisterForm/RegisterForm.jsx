import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../config/api.js";
import TextField from "../TextField/TextField.jsx";
import PasswordField from "../PasswordField/PasswordField.jsx";
import Button from "../Button/Button.jsx";
import DividerWithLabel from "../DividerWithLabel/DividerWithLabel.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./RegisterForm.css";

export default function RegisterForm({
  loginHref = "/login",
  backHref = "/",
}) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [provinceState, setProvinceState] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(firstName || "").trim(),
          lastName: String(lastName || "").trim(),
          email: String(email || "").trim(),
          city: String(city || "").trim(),
          provinceState: String(provinceState || "").trim(),
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Registration failed");
      }
      navigate(loginHref);
    } catch (err) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-form-card">
      <header className="register-form-header">
        <h1 className="register-form-title">Create your account</h1>
        <p className="register-form-subtitle">
          Start swapping stories with fellow readers.
        </p>
      </header>
      <form className="register-form-form" onSubmit={handleRegister} noValidate>
        {error ? (
          <p className="register-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <TextField
          id="register-first-name"
          name="firstName"
          label="First Name"
          type="text"
          placeholder="John"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          id="register-last-name"
          name="lastName"
          label="Last Name"
          type="text"
          placeholder="Doe"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
          id="register-email"
          name="email"
          label="Email Address"
          type="email"
          placeholder="john.doe@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="register-form-row">
          <TextField
            id="register-city"
            name="city"
            label="City"
            type="text"
            placeholder="e.g. Kelowna"
            autoComplete="address-level2"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="register-form-row-field"
          />
          <TextField
            id="register-province-state"
            name="provinceState"
            label="Province / State"
            type="text"
            placeholder="e.g. Alberta / California"
            autoComplete="address-level1"
            required
            value={provinceState}
            onChange={(e) => setProvinceState(e.target.value)}
            className="register-form-row-field"
          />
        </div>
        <PasswordField
          label="Password"
          name="password"
          showForgotLink={false}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="terracotta"
          type="submit"
          className="register-form-submit"
          disabled={submitting}
        >
          <span className="register-form-submit-inner">
            {submitting ? "Creating…" : "Create account"}
            <MaterialIcon
              name="arrow_forward"
              className="register-form-submit-icon"
            />
          </span>
        </Button>
      </form>
      <DividerWithLabel />
      <div className="register-form-login">
        <p className="register-form-login-text">
          Already have an account?{" "}
          <Link className="register-form-login-link" to={loginHref}>
            Log in
          </Link>
        </p>
      </div>
      <div className="register-form-back">
        <Link to={backHref} className="register-form-back-link">
          <MaterialIcon name="west" className="register-form-back-icon" />
          <span className="register-form-back-text">Back to Browse</span>
        </Link>
      </div>
    </div>
  );
}
