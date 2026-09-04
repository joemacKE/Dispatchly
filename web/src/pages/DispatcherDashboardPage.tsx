import { useCallback, useEffect, useState } from "react";

import { Navigate } from "react-router-dom";

import {
  API_URL,
  assignDelivery,
  getDashboardOrders,
  getDashboardStats,
  getRiders,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import DispatcherOrdersTable from "../components/dispatcher/DispatcherOrdersTable";

import DispatcherStatsCards from "../components/dispatcher/DispatcherStatsCards";

import type { Delivery, Rider } from "../types";

export default function DispatcherDashboardPage() {
  const { token, user, logout } = useAuth();

  const [orders, setOrders] = useState<Delivery[]>([]);

  const [riders, setRiders] = useState<Rider[]>([]);

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );

  const [selectedRiderId, setSelectedRiderId] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [stats, setStats] = useState({
    pending: 0,

    assigned: 0,

    in_transit: 0,

    delivered: 0,
  });

  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const [error, setError] = useState("");

  const [live, setLive] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) return;

    try {
      const result = await getDashboardOrders(token, selectedStatus);

      setOrders(result.orders);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load deliveries",
      );
    }
  }, [token, selectedStatus]);

  const loadStats = useCallback(async () => {
    if (!token) return;

    try {
      const result = await getDashboardStats(token);

      setStats({
        pending: Number(result.stats.pending ?? 0),

        assigned: Number(result.stats.assigned ?? 0),

        in_transit: Number(result.stats.in_transit ?? 0),

        delivered: Number(result.stats.delivered ?? 0),
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load statistics",
      );
    }
  }, [token]);

  const loadRiders = useCallback(async () => {
    if (!token) return;

    try {
      const result = await getRiders(token);

      setRiders(result.riders);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load riders",
      );
    }
  }, [token]);

  useEffect(() => {
    void loadOrders();

    void loadStats();

    void loadRiders();
  }, [loadOrders, loadStats, loadRiders]);

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(`${API_URL.replace(/^http/, "ws")}/ws`);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "auth",

          token,
        }),
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "authentication.success") {
        setLive(true);
      }

      if (message.type?.startsWith("delivery.")) {
        void loadOrders();

        void loadStats();
      }
    };

    socket.onerror = () => {
      setLive(false);
    };

    socket.onclose = () => {
      setLive(false);
    };

    return () => socket.close();
  }, [token, loadOrders, loadStats]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "rider") {
    return <Navigate to="/rider" replace />;
  }

  function openAssignModal(delivery: Delivery) {
    setError("");

    setSelectedDelivery(delivery);

    setSelectedRiderId("");

    setShowAssignModal(true);
  }

  async function confirmAssignment() {
    if (!token || !selectedDelivery || !selectedRiderId) {
      return;
    }

    try {
      setLoadingAssignment(true);

      setError("");

      await assignDelivery(
        token,

        selectedDelivery.id,

        selectedRiderId,

        selectedDelivery.version,
      );

      setShowAssignModal(false);

      setSelectedDelivery(null);

      setSelectedRiderId("");

      await loadOrders();

      await loadStats();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to assign rider",
      );
    } finally {
      setLoadingAssignment(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark small">R</div>

          <div>
            <strong>Reflex</strong>

            <span>Dispatcher Operations</span>
          </div>
        </div>

        <div className="user-row">
          <span className={live ? "live-pill online" : "live-pill"}>
            {live ? "● Live" : "○ Connecting"}
          </span>

          <div>
            <strong>{user.name}</strong>

            <span>dispatcher</span>
          </div>

          <button className="secondary-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard">
        <header className="page-heading">
          <p className="eyebrow">Operations</p>

          <h1>Dispatcher Dashboard</h1>

          <p className="muted">
            Manage delivery allocation and rider coordination.
          </p>
        </header>

        <DispatcherStatsCards
          stats={stats}
          selected={selectedStatus}
          onSelect={setSelectedStatus}
        />

        {error && <div className="error-box">{error}</div>}

        <section className="panel">
          <div className="panel-heading">
            <h2>{selectedStatus || "All Deliveries"}</h2>

            <p className="muted">{orders.length} deliveries</p>
          </div>

          <DispatcherOrdersTable orders={orders} onAssign={openAssignModal} />
        </section>

        {showAssignModal && selectedDelivery && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Assign Rider</h2>

              <p>
                Select rider for:
                <strong> {selectedDelivery.customer_name}</strong>
              </p>

              {riders.length === 0 ? (
                <div className="empty-state">No active riders available.</div>
              ) : (
                <select
                  className="rider-select"
                  value={selectedRiderId}
                  disabled={loadingAssignment}
                  onChange={(event) => setSelectedRiderId(event.target.value)}
                >
                  <option value="">Select rider</option>

                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                className="primary-button"
                disabled={loadingAssignment || !selectedRiderId}
                onClick={confirmAssignment}
              >
                Confirm Assignment
              </button>

              <button
                className="secondary-button"
                disabled={loadingAssignment}
                onClick={() => {
                  setShowAssignModal(false);

                  setSelectedDelivery(null);

                  setSelectedRiderId("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
