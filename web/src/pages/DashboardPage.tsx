import { useCallback, useEffect, useMemo, useState } from "react";

import { Navigate } from "react-router-dom";

import {
  API_URL,
  assignDelivery,
  createDelivery,
  getDeliveries,
  getDeliveryQr,
  getPickupQr,
  getRiders,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import DeliveryCard from "../components/DeliveryCard";
import NewDeliveryForm from "../components/NewDeliveryForm";

import type { Delivery, Rider } from "../types";

export default function DashboardPage() {
  const { token, user, logout } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const [riders, setRiders] = useState<Rider[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [live, setLive] = useState(false);

  const loadData = useCallback(async () => {
    if (!token || !user) {
      return;
    }

    try {
      setError("");

      const result = await getDeliveries(token);

      setDeliveries(result.deliveries);

      if (user.role === "dispatcher") {
        const riderResult = await getRiders(token);

        setRiders(riderResult.riders);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const websocketUrl = API_URL.replace(/^http/, "ws");

    const socket = new WebSocket(`${websocketUrl}/ws`);

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "auth",
          token,
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as {
          type?: string;
        };

        if (message.type === "authentication.success") {
          setLive(true);
          return;
        }

        if (message.type?.startsWith("delivery.")) {
          void loadData();
        }
      } catch {
        console.error("Invalid WebSocket message");
      }
    });

    socket.addEventListener("close", () => {
      setLive(false);
    });

    socket.addEventListener("error", () => {
      setLive(false);
    });

    return () => {
      socket.close();
    };
  }, [token, loadData]);

  const counts = useMemo(
    () => ({
      total: deliveries.length,

      pending: deliveries.filter((delivery) => delivery.status === "pending")
        .length,

      active: deliveries.filter((delivery) =>
        ["assigned", "picked_up", "in_transit"].includes(delivery.status),
      ).length,

      delivered: deliveries.filter(
        (delivery) => delivery.status === "delivered",
      ).length,
    }),
    [deliveries],
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "rider") {
    return <Navigate to="/rider" replace />;
  }

  async function addDelivery(data: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    item_description: string;
  }) {
    if (!token) {
      return;
    }

    await createDelivery(token, data);

    await loadData();
  }

  async function assign(delivery: Delivery, riderId: string) {
    if (!token) {
      return;
    }

    try {
      setError("");

      await assignDelivery(token, delivery.id, riderId, delivery.version);

      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to assign rider",
      );

      await loadData();
    }
  }

  async function getQr(deliveryId: string) {
    if (!token) {
      throw new Error("Authentication required");
    }

    return getDeliveryQr(token, deliveryId);
  }

  async function getPickupVerificationQr(
    deliveryId: string
  ) {
    if (!token) {
      throw new Error(
        "Authentication required"
      );
    }

    if (
      user?.role !==
      "retailer"
    ) {
      throw new Error(
        "Only the retailer can display the pickup QR code"
      );
    }

    return getPickupQr(
      token,
      deliveryId
    );
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

        <div className="user-row">
          <span className={live ? "live-pill online" : "live-pill"}>
            {live ? "● Live" : "○ Connecting"}
          </span>

          <div>
            <strong>{user.name}</strong>

            <span>{user.role}</span>
          </div>

          <button className="secondary-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard">
        <header className="page-heading">
          <p className="eyebrow">Operations</p>

          <h1>Delivery Dashboard</h1>

          <p className="muted">
            Monitor and coordinate deliveries in real time.
          </p>
        </header>

        <section className="stats">
          <article>
            <span>Total</span>
            <strong>{counts.total}</strong>
          </article>

          <article>
            <span>Pending</span>
            <strong>{counts.pending}</strong>
          </article>

          <article>
            <span>Active</span>
            <strong>{counts.active}</strong>
          </article>

          <article>
            <span>Delivered</span>
            <strong>{counts.delivered}</strong>
          </article>
        </section>

        {error && <div className="error-box">{error}</div>}

        <section
          className={
            user.role === "retailer"
              ? "dashboard-grid"
              : "dashboard-grid single"
          }
        >
          {user.role === "retailer" && (
            <NewDeliveryForm onSubmit={addDelivery} />
          )}

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Deliveries</h2>

                <p className="muted">{deliveries.length} total</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => void loadData()}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="empty-state">Loading deliveries...</div>
            ) : deliveries.length === 0 ? (
              <div className="empty-state">No deliveries yet.</div>
            ) : (
              <div className="delivery-list">
                {deliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    riders={riders}
                    isDispatcher={user.role === "dispatcher"}
                    isRetailer={user.role === "retailer"}
                    onAssign={assign}
                    onGetQr={getQr}
                    onGetPickupQr={getPickupVerificationQr}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
