import { useCallback, useEffect, useState } from "react";

import { Navigate } from "react-router-dom";

import {
  API_URL,
  assignDelivery,
  createDelivery,
  getDeliveries,
  getDeliveryQr,
  getPickupQr,
  getRiders,
  getDashboardStats,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import DeliveryCard from "../components/DeliveryCard";
import NewDeliveryForm from "../components/NewDeliveryForm";
import OrderStatsCards from "../components/dashboard/OrderStatsCards";

import type { Delivery, Rider } from "../types";

type DeliveryForm = {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_description: string;
  payment_method: "prepaid" | "cash_on_delivery";
  payment_amount?: number;
};

export default function DashboardPage() {
  const { token, user, logout } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    picked_up: 0,
    delivered: 0,
    failed: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState("");

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

  // NEW FUNCTION STARTS HERE
  const loadDashboardStats = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getDashboardStats(token);

      setDashboardStats(result.stats);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard statistics",
      );
    }
  }, [token]);

  useEffect(() => {
    void loadData();

    void loadDashboardStats();
  }, [loadData, loadDashboardStats]);

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

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "rider") {
    return <Navigate to="/rider" replace />;
  }

  async function addDelivery(data: DeliveryForm) {
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

  async function getPickupVerificationQr(deliveryId: string) {
    if (!token || !user) {
      throw new Error("Authentication required");
    }

    if (user.role !== "retailer") {
      throw new Error("Only the retailer can display the pickup QR code");
    }

    return getPickupQr(token, deliveryId);
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

        <OrderStatsCards
          stats={dashboardStats}
          selected={selectedStatus}
          onSelect={setSelectedStatus}
        />

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
