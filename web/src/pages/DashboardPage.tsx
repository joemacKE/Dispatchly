import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { Navigate } from "react-router-dom";

import {
  API_URL,
  createDelivery,
  getDashboardStats,
  getDashboardOrders,
  getPickupQr,
  getDeliveryQr,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import NewDeliveryForm from "../components/NewDeliveryForm";
import RetailerStatsCards from "../components/retailer/RetailerStatsCards";
import RetailerPerformanceCard from "../components/retailer/RetailerPerformanceCard";
import RetailerTrendCard from "../components/retailer/RetailerTrendCard";
import RetailerLocationsCard from "../components/retailer/RetailerLocationsCard";
import RetailerRevenueCard from "../components/retailer/RetailerRevenueCard";
import RetailerAnalyticsFilter from "../components/retailer/RetailerAnalyticsFilter";

import OrdersTable from "../components/dashboard/OrdersTable";

import QrModal from "../components/QrModal";

import Navbar from "../components/layout/Navbar";

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
  const { token, user } = useAuth();

  const [orders, setOrders] = useState<Delivery[]>([]);

  const [allOrders, setAllOrders] = useState<Delivery[]>([]);

  const [dashboardStats, setDashboardStats] = useState({
    pending: 0,

    assigned: 0,

    in_transit: 0,

    delivered: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState<
    "today" | "7days" | "30days" | "all"
  >("7days");

  const [error, setError] = useState("");

  const [live, setLive] = useState(false);

  const [qrValue, setQrValue] = useState("");

  const [qrTitle, setQrTitle] = useState("");

  const [showQrModal, setShowQrModal] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getDashboardOrders(token, selectedStatus);

      setOrders(result.orders);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load orders",
      );
    }
  }, [token, selectedStatus]);
  const loadAllOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getDashboardOrders(token);

      setAllOrders(result.orders);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load analytics data",
      );
    }
  }, [token]);
  const analyticsOrders = allOrders.filter((order) => {
    if (!order.created_at) {
      return false;
    }

    if (analyticsPeriod === "all") {
      return true;
    }

    const created = new Date(order.created_at);

    const now = new Date();

    if (analyticsPeriod === "today") {
      return created.toDateString() === now.toDateString();
    }

    const days = analyticsPeriod === "7days" ? 7 : 30;

    const difference = now.getTime() - created.getTime();

    return difference <= days * 24 * 60 * 60 * 1000;
  });

  const loadDashboardStats = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getDashboardStats(token);

      setDashboardStats({
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

  useEffect(() => {
    void loadOrders();

    void loadAllOrders();

    void loadDashboardStats();
  }, [loadOrders, loadAllOrders, loadDashboardStats]);
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
        const message = JSON.parse(event.data);

        if (message.type === "authentication.success") {
          setLive(true);
        }

        if (message.type?.startsWith("delivery.")) {
          void loadOrders();

          void loadAllOrders();

          void loadDashboardStats();
        }
      } catch {
        console.error("Invalid websocket message");
      }
    });

    socket.addEventListener("close", () => setLive(false));

    socket.addEventListener("error", () => setLive(false));

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

    try {
      setError("");

      await createDelivery(token, data);

      await loadOrders();

      await loadAllOrders();

      await loadDashboardStats();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create delivery",
      );
    }
  }

  async function openPickupQr(order: Delivery) {
    if (!token) {
      return;
    }

    const qr = await getPickupQr(token, order.id);

    setQrValue(qr);

    setQrTitle("Pickup QR Code");

    setShowQrModal(true);
  }

  async function openDeliveryQr(order: Delivery) {
    if (!token) {
      return;
    }

    const qr = await getDeliveryQr(token, order.id);

    setQrValue(qr);

    setQrTitle("Delivery QR Code");

    setShowQrModal(true);
  }

  return (
    <div className="app-shell">
      <Navbar live={live} />

      <main className="dashboard">
        <section className="retailer-header">
          <div className="retailer-welcome">
            <div className="retailer-avatar">
              <span>R</span>
            </div>

            <div>
              <p className="eyebrow">RETAILER DASHBOARD</p>

              <h1>Good afternoon, {user.name}</h1>

              <p className="muted">
                Manage your deliveries, customers and business performance.
              </p>
            </div>
          </div>

          <div className="business-summary">
            <div>
              <span>Business Code</span>

              <strong>{user.business_code ?? "N/A"}</strong>
            </div>

            <div>
              <span>Business</span>

              <strong>{user.business_name ?? "Your Business"}</strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="active-status">Active</strong>
            </div>
          </div>
        </section>

        <RetailerStatsCards
          stats={dashboardStats}
          selected={selectedStatus}
          onSelect={setSelectedStatus}
        />

        {error && <div className="error-box">{error}</div>}

        <section className="retailer-main-grid">
          <div className="retailer-section-card">
            <div className="section-heading">
              <h2>Create New Delivery</h2>

              <p>Send a new delivery request to Dispatchly.</p>
            </div>

            <NewDeliveryForm onSubmit={addDelivery} />
          </div>

          <div className="retailer-section-card orders-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Deliveries</h2>

                <p className="muted">{orders.length} active orders</p>
              </div>

              <button
                className="secondary-button icon-button"
                title="Refresh orders"
                onClick={() => void loadOrders()}
              >
                <FontAwesomeIcon icon={faRotate} />
              </button>
            </div>

            <div className="orders-table-scroll">
              <OrdersTable
                orders={orders}
                onPickupQr={openPickupQr}
                onDeliveryQr={openDeliveryQr}
              />
            </div>
          </div>
        </section>
        <RetailerAnalyticsFilter
          period={analyticsPeriod}
          onChange={setAnalyticsPeriod}
        />
        <section className="retailer-intelligence-grid">
          <RetailerPerformanceCard stats={dashboardStats} />

          <RetailerTrendCard orders={analyticsOrders} />

          <RetailerLocationsCard orders={analyticsOrders} />

          <RetailerRevenueCard orders={analyticsOrders} />
        </section>

        {showQrModal && (
          <QrModal
            title={qrTitle}
            qrValue={qrValue}
            onClose={() => {
              setShowQrModal(false);

              setQrValue("");
            }}
          />
        )}
      </main>
    </div>
  );
}
