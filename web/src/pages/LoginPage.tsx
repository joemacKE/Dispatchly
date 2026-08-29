import { useState, type FormEvent } from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { token, user, login } = useAuth();

  /*
   * Demo credentials are shown only while running
   * the Vite development server.
   *
   * Production builds will start with empty fields
   * and will not display the demo account details.
   */
  const showDemoAccounts = import.meta.env.DEV;

  const [phone, setPhone] = useState(showDemoAccounts ? "+254700000002" : "");

  const [password, setPassword] = useState(showDemoAccounts ? "Demo123!" : "");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /*
   * If already authenticated, send users to the
   * correct interface according to their role.
   */
  if (token && user) {
    return (
      <Navigate replace to={user.role === "rider" ? "/rider" : "/dashboard"} />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await login(phone.trim(), password);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">R</div>

        <h1>Reflex</h1>

        <p className="muted">Delivery coordination for modern retailers.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Phone number
            <input
              type="tel"
              name="phone"
              autoComplete="username"
              placeholder="+254..."
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              disabled={loading}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
          </label>

          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading || !phone.trim() || !password}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {showDemoAccounts && (
          <div className="demo-box">
            <strong>Development accounts</strong>

            <span>Retailer: +254700000002</span>

            <span>Dispatcher: +254700000003</span>

            <span>Rider: +254700000004</span>

            <span>Password: Demo123!</span>
          </div>
        )}
      </section>
    </main>
  );
}
