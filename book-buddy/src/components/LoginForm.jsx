import "./LoginForm.css";

function LoginForm() {
  return (
    <section className="login-page">
      <h1 className="app-title">BookBuddy</h1>

      <div className="login-wrapper">
        <h2 className="login-title">Login</h2>

        <div className="login-card">
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="Enter email" />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Enter password" />
          </div>

          <button className="primary">Sign In</button>
          <button className="secondary">Create a New Account</button>
        </div>
      </div>
    </section>
  );
}

export default LoginForm;