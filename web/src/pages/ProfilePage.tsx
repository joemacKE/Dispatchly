import { useState } from "react";

import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);

  async function copyBusinessCode() {
    if (!user?.business_code) {
      return;
    }

    await navigator.clipboard.writeText(user.business_code);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark small">R</div>

          <div>
            <strong>Reflex</strong>

            <span>Delivery Coordination</span>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <header className="page-heading">
          <p className="eyebrow">Account</p>

          <h1>Profile Settings</h1>

          <p className="muted">Manage your account and business information.</p>
        </header>

        <section className="dashboard-grid">
          <div className="panel">
            <h2>Personal Information</h2>

            <div className="profile-row">
              <span>Name</span>

              <strong>{user?.name}</strong>
            </div>

            <div className="profile-row">
              <span>Phone</span>

              <strong>{user?.phone}</strong>
            </div>

            <div className="profile-row">
              <span>Role</span>

              <strong>{user?.role}</strong>
            </div>
          </div>

          {user?.role === "retailer" && (
            <div className="panel">
              <h2>Business Information</h2>

              <div className="profile-row">
                <span>Business Name</span>

                <strong>{user.business_name}</strong>
              </div>

              <div className="profile-row">
                <span>Business Code</span>

                <div>
                  <strong>{user.business_code}</strong>

                  <button
                    className="secondary-button"
                    onClick={copyBusinessCode}
                  >
                    {copied ? "Copied" : "Copy Code"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
