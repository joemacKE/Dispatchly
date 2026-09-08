import { useCallback, useEffect, useState } from "react";

import { Navigate, useNavigate } from "react-router-dom";

import {
  API_URL,
  createDelivery,
  getDashboardStats,
  getDashboardOrders,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import NewDeliveryForm from "../components/NewDeliveryForm";
import OrderStatsCards from "../components/dashboard/OrderStatsCards";

import OrdersTable from "../components/dashboard/OrdersTable";

import type { Delivery } from "../types";

type DeliveryForm = {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_description: string;
  payment_method: "prepaid" | "cash_on_delivery";
  payment_amount?: number;
};
import { getPickupQr, getDeliveryQr } from "../api/client";

import QrModal from "../components/QrModal";

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Delivery[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    pending: 0,
    assigned: 0,
    in_transit: 0,
    delivered: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState("");

  const [error, setError] = useState("");

  const [live, setLive] = useState(false);
  const [qrValue, setQrValue] = useState("");

  const [qrTitle, setQrTitle] = useState("");

  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getDashboardOrders(token, selectedStatus);

      console.log("DASHBOARD ORDERS RESPONSE:", result);

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

      setDashboardStats({
        pending: Number(result.stats.pending ?? 0),

        assigned: Number(result.stats.assigned ?? 0),

        in_transit: Number(result.stats.in_transit ?? 0),

        delivered: Number(result.stats.delivered ?? 0),
      });
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
  async function copyBusinessCode() {
    if (!user?.business_code) {
      return;
    }

    await navigator.clipboard.writeText(user.business_code);

    setCopiedCode(true);

    setTimeout(() => {
      setCopiedCode(false);
    }, 2000);
  }
  async function addDelivery(data: DeliveryForm) {
    if (!token) {
      return;
    }

    try {
      setError("");

      await createDelivery(token, data);

      await loadOrders();

      await loadDashboardStats();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create delivery request",
      );
    }
  }
  async function openPickupQr(order: Delivery) {
    if (!token) {
      return;
    }

    try {
      const qr = await getPickupQr(token, order.id);

      setQrValue(qr);

      setQrTitle("Pickup QR Code");

      setShowQrModal(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to generate pickup QR",
      );
    }
  }

  async function openDeliveryQr(order: Delivery) {
    if (!token) {
      return;
    }

    try {
      const qr = await getDeliveryQr(token, order.id);

      setQrValue(qr);

      setQrTitle("Delivery QR Code");

      setShowQrModal(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate delivery QR",
      );
    }
  }
  return (
    <div className="app-shell">
      <header className="topbar relative z-50">
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

          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="
  flex
  items-center
  gap-3
  rounded-full
  border
  border-slate-200
  bg-white
  px-4
  py-2
  shadow-sm
  hover:bg-slate-50
  "
            >
              <div
                className="
 w-10
 h-10
 rounded-full
 bg-emerald-600
 text-white
 flex
 items-center
 justify-center
 font-bold
 "
              >
                {user.name.charAt(0)}
              </div>

              <div className="text-left">
                <p
                  className="
font-semibold
text-slate-900
"
                >
                  {user.name}
                </p>

                <p
                  className="
text-xs
text-slate-500
capitalize
"
                >
                  {user.role}
                </p>
              </div>

              <span>⌄</span>
            </button>

            {profileMenuOpen && (
              <div
                className="
    absolute
    right-0
    top-full
    mt-3
    w-64
    rounded-2xl
    bg-white
    border
    border-slate-200
    shadow-xl
    p-3
    z-50
    "
              >
                <div
                  className="
      px-4
      py-3
      border-b
      border-slate-100
      "
                >
                  <p
                    className="
        font-bold
        text-slate-900
        "
                  >
                    {user.name}
                  </p>

                  <p
                    className="
        text-sm
        text-slate-500
        capitalize
        "
                  >
                    {user.role}
                  </p>
                </div>

                <button
                  className="
      w-full
      text-left
      px-4
      py-3
      rounded-xl
      hover:bg-slate-100
      text-slate-700
      font-medium
      "
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </button>

                <button
                  className="
      w-full
      text-left
      px-4
      py-3
      rounded-xl
      hover:bg-slate-100
      text-slate-700
      font-medium
      "
                >
                  Settings
                </button>

                <button
                  className="
      w-full
      text-left
      px-4
      py-3
      rounded-xl
      hover:bg-red-50
      text-red-600
      font-medium
      "
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
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
        {user.role === "retailer" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Business Profile</h2>

                <p className="muted">
                  Share this code with your dispatchers and riders.
                </p>
              </div>
            </div>

            <div>
              <h3>{user.business_name ?? "Your Business"}</h3>

              <p className="muted">Business Code</p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "8px",
                }}
              >
                <strong
                  style={{
                    fontSize: "1.4rem",
                    letterSpacing: "2px",
                  }}
                >
                  {user.business_code ?? "Unavailable"}
                </strong>

                {user.business_code && (
                  <button
                    className="secondary-button"
                    onClick={copyBusinessCode}
                  >
                    {copiedCode ? "Copied" : "Copy Code"}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
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
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())
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
                <OrdersTable
                  orders={orders}
                  onPickupQr={openPickupQr}
                  onDeliveryQr={openDeliveryQr}
                />
              </div>
            )}
          </div>
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
