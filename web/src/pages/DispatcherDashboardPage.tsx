import { useCallback, useEffect, useState } from "react";

import { Navigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import {
  API_URL,
  assignDelivery,
  getDashboardOrders,
  getDashboardStats,
  getRiders,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import { useNotifications } from "../notifications/NotificationContext";

import { buildNotification } from "../notifications/notificationHelpers";

import DispatcherOrdersTable from "../components/dispatcher/DispatcherOrdersTable";

import DispatcherStatsCards from "../components/dispatcher/DispatcherStatsCards";

import DispatcherIntelligenceCards from "../components/dispatcher/DispatcherInteligenceCards";

import DispatcherPriorityQueue from "../components/dispatcher/DispatcherPriorityQueue";

import DispatcherRiderStatus from "../components/dispatcher/DispatcherRiderStatus";

import DispatcherSidebar from "../components/layout/DispatcherSidebar";

import Navbar from "../components/layout/Navbar";

import type { Delivery, Rider } from "../types";

type InsightType =
  | "unassigned"
  | "delayed"
  | "available_riders"
  | "busy_riders";

type ViewType = "deliveries" | "dashboard";

export default function DispatcherDashboardPage() {
  const { token, user } = useAuth();

  const { addNotification } = useNotifications();

  const [orders, setOrders] = useState<Delivery[]>([]);

  const [riders, setRiders] = useState<Rider[]>([]);

  const [stats, setStats] = useState({
    pending: 0,

    assigned: 0,

    in_transit: 0,

    delivered: 0,
  });

  /*
   * Default dispatcher landing view
   *
   * Deliveries table opens first
   */

  const [activeView, setActiveView] = useState<ViewType>("deliveries");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [activeInsight, setActiveInsight] = useState<InsightType | null>(null);

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );

  const [selectedRiderId, setSelectedRiderId] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);

  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const [error, setError] = useState("");

  const [live, setLive] = useState(false);

  /*
   * Load dispatcher deliveries
   */

  const loadOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getDashboardOrders(token, selectedStatus);

      setOrders(result.orders);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load deliveries",
      );
    }
  }, [token, selectedStatus]);

  /*
   * Load dashboard statistics
   */

  const loadStats = useCallback(async () => {
    if (!token) {
      return;
    }

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

  /*
   * Load riders
   */

  const loadRiders = useCallback(async () => {
    if (!token) {
      return;
    }

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

  /*
   * Real-time delivery updates
   */

  useEffect(() => {
    if (!token) {
      return;
    }

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
      try {
        const message = JSON.parse(event.data);

        if (message.type === "authentication.success") {
          setLive(true);
        }

        if (message.type?.startsWith("delivery.")) {
          const notification = buildNotification(message.type);

          if (notification) {
            addNotification(notification);
          }

          void loadOrders();

          void loadStats();
        }
      } catch {
        console.error("Invalid websocket message");
      }
    };

    socket.onerror = () => {
      setLive(false);
    };

    socket.onclose = () => {
      setLive(false);
    };

    return () => {
      socket.close();
    };
  }, [token, loadOrders, loadStats, addNotification]);

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
      <Navbar live={live} />

      <div className="dispatcher-layout">
        <DispatcherSidebar
          activeView={activeView}
          setActiveView={setActiveView}
        />

        <main className="dashboard">
          <header className="page-heading">
            <p className="eyebrow">Operations</p>

            <h1>Dispatcher Dashboard</h1>

            <p className="muted">
              Manage delivery allocation and rider coordination.
            </p>
          </header>

          {error && <div className="error-box">{error}</div>}

          {/* ===================================
              DELIVERIES VIEW
              
              DEFAULT LOGIN VIEW
          =================================== */}

          {activeView === "deliveries" && (
            <section className="dispatcher-orders-panel">
              <div className="panel-heading">
                <div>
                  <h2>{selectedStatus || "All Deliveries"}</h2>

                  <p className="muted">{orders.length} deliveries</p>
                </div>
              </div>

              <DispatcherOrdersTable
                orders={orders}
                onAssign={openAssignModal}
              />
            </section>
          )}

          {/* ===================================
              DASHBOARD VIEW

              INTELLIGENCE ONLY
              
              NO ORDERS TABLE
          =================================== */}

          {activeView === "dashboard" && (
            <>
              <DispatcherStatsCards
                stats={stats}
                selected={selectedStatus}
                onSelect={setSelectedStatus}
              />

              <DispatcherIntelligenceCards
                orders={orders}
                riders={riders}
                activeInsight={activeInsight}
                setActiveInsight={setActiveInsight}
              />

              <section className="dispatcher-intelligence-layout">
                <DispatcherPriorityQueue
                  orders={orders}
                  onAssign={openAssignModal}
                />

                <DispatcherRiderStatus riders={riders} />
              </section>
            </>
          )}
        </main>
      </div>

      {/* ===================================
          ASSIGN RIDER MODAL
      =================================== */}

      {showAssignModal && selectedDelivery && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setShowAssignModal(false);

                setSelectedDelivery(null);

                setSelectedRiderId("");
              }}
              aria-label="Close assignment modal"
            >
              ×
            </button>

            <h2>Assign Rider</h2>

            <p>
              Select rider for:{" "}
              <strong>{selectedDelivery.customer_name}</strong>
            </p>

            {riders.length === 0 ? (
              <div className="empty-state">No active riders available.</div>
            ) : (
              <div className="space-y-3">
                {riders.map((rider) => (
                  <button
                    key={rider.id}
                    type="button"
                    disabled={rider.availability === "busy"}
                    onClick={() => setSelectedRiderId(rider.id)}
                    className={`

                      w-full

                      flex

                      items-center

                      justify-between

                      rounded-xl

                      border

                      px-4

                      py-3

                      text-left

                      transition


                      ${
                        selectedRiderId === rider.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white"
                      }



                      ${
                        rider.availability === "busy"
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-slate-50"
                      }


                    `}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {rider.name}
                      </div>

                      <div className="text-sm text-slate-500">
                        {rider.active_deliveries} active deliveries
                      </div>
                    </div>

                    <div>
                      {rider.availability === "available" ? (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="text-emerald-500 text-xl"
                          title="Available"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="text-red-500 text-xl"
                          title="Busy"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              className="primary-button"
              disabled={loadingAssignment || !selectedRiderId}
              onClick={confirmAssignment}
            >
              {loadingAssignment ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
