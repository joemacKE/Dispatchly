import { useCallback, useEffect, useState } from "react";

import { Navigate } from "react-router-dom";

import {
  API_URL,
  createDelivery,
  getDashboardStats,
  getDashboardOrders,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import NewDeliveryForm from "../components/NewDeliveryForm";
import OrderStatsCards from "../components/dashboard/OrderStatsCards";

import type { Delivery } from "../types";

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

  const [orders, setOrders] = useState<Delivery[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    picked_up: 0,
    delivered: 0,
    failed: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState("");

  const [error, setError] = useState("");

  const [live, setLive] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError("");

      const result = await getDashboardOrders(
        token,
        selectedStatus || undefined,
      );

      setOrders(result.orders);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load orders",
      );
    }
  }, [token, selectedStatus]);

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
    void loadOrders();

    void loadDashboardStats();
  }, [loadOrders, loadDashboardStats]);

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
          void loadOrders();
          void loadDashboardStats();
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
  }, [token, loadOrders, loadDashboardStats]);

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

    await loadOrders();
    await loadDashboardStats();
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
                <h2>
                  {selectedStatus
                    ? selectedStatus
                        .replace("_", " ")
                        .replace(/\b\w/g, (letter) => letter.toUpperCase())
                    : "All Orders"}
                </h2>

                <p className="muted">{orders.length} orders</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => void loadOrders()}
              >
                Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">No orders found.</div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.customer_name}</strong>
                        </td>

                        <td>{order.customer_phone}</td>

                        <td>{order.item_description}</td>

                        <td>
                          <span className={`status-badge ${order.status}`}>
                            {order.status.replace("_", " ")}
                          </span>
                        </td>

                        <td>{order.payment_method?.replaceAll("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
