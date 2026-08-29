import { useState, type FormEvent } from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { token, user, login } = useAuth();

  const [phone, setPhone] = useState("+254700000002");

  const [password, setPassword] = useState("Demo123!");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  if (token && user) {
    return (
      <Navigate replace to={user.role === "rider" ? "/rider" : "/dashboard"} />
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await login(phone, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
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

        <form onSubmit={submit} className="form-stack">
          <label>
            Phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="demo-box">
          <strong>Development accounts</strong>

          <span>Retailer: +254700000002</span>

          <span>Dispatcher: +254700000003</span>

          <span>Rider: +254700000004</span>

          <span>Password: Demo123!</span>
        </div>
      </section>
    </main>
  );
}
