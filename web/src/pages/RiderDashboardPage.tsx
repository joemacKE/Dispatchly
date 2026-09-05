import { useCallback, useEffect, useMemo, useState } from "react";

import { Navigate } from "react-router-dom";

import {
  getMyDeliveries,
  syncOfflineEvents,
  verifyPickup,
  verifyDelivery,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import RiderOrdersTable from "../components/rider/RiderOrdersTable";
import RiderStatsCards from "../components/rider/RiderStatsCards";
import QrScanner from "../components/QrScanner";

import {
  clearOfflineQueue,
  getOfflineQueue,
  saveOfflineQueue,
} from "../rider/offlineQueue";

import type { Delivery } from "../types";

function getLocation(): Promise<{
  lat?: number;
  lng?: number;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,

          lng: position.coords.longitude,
        });
      },

      () => {
        resolve({});
      },

      {
        timeout: 5000,
        maximumAge: 60000,
      },
    );
  });
}

export default function RiderDashboardPage() {
  const { token, user, logout } = useAuth();

  const riderId = user?.id || "unknown";

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    "" | "assigned" | "in_transit" | "delivered"
  >("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const [scanMode, setScanMode] = useState<"pickup" | "delivery">("pickup");

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [online, setOnline] = useState(navigator.onLine);

  const [queueCount, setQueueCount] = useState(getOfflineQueue(riderId).length);

  const loadDeliveries = useCallback(
    async (status?: "assigned" | "in_transit" | "delivered") => {
      if (!token) {
        return;
      }

      try {
        setLoading(true);

        const result = await getMyDeliveries(token, status);

        console.log("FILTER RESPONSE", status, result.deliveries);

        setDeliveries(result.deliveries ?? []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load deliveries",
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );
  const loadAllDeliveries = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getMyDeliveries(token);

      setAllDeliveries(result.deliveries ?? []);

      setDeliveries(result.deliveries ?? []);
    } catch (error) {
      console.error(error);
    }
  }, [token]);
  /*
   * This remains only so riders can
   * resolve queues created by older
   * versions of the application.
   *
   * The new pickup workflow never
   * creates offline custody events.
   */
  const flushQueue = useCallback(async () => {
    if (!token || !navigator.onLine) {
      return;
    }

    const queue = getOfflineQueue(riderId);

    if (!queue.length) {
      setQueueCount(0);

      return;
    }

    try {
      const result = await syncOfflineEvents(token, queue);

      const finished = new Set(
        result.results
          .filter(
            (item) => item.result === "applied" || item.result === "duplicate",
          )
          .map((item) => item.client_event_id),
      );

      const remaining = queue.filter(
        (event) => !finished.has(event.client_event_id),
      );

      saveOfflineQueue(riderId, remaining);

      setQueueCount(remaining.length);

      if (remaining.length) {
        setError(
          `${remaining.length} legacy offline event(s) were rejected or conflicted. Pickup verification now requires an online QR scan.`,
        );
      }

      await loadDeliveries();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Offline synchronization failed",
      );
    }
  }, [token, riderId, loadDeliveries]);

  useEffect(() => {
    void loadAllDeliveries();
  }, [loadAllDeliveries]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);

      void flushQueue();
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);

    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);

      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueue]);

  useEffect(() => {
    if (navigator.onLine) {
      void flushQueue();
    }
  }, [flushQueue]);

  const counts = useMemo(
    () => ({
      assigned: allDeliveries.filter(
        (delivery) => delivery.status === "assigned",
      ).length,

      in_transit: allDeliveries.filter(
        (delivery) => delivery.status === "in_transit",
      ).length,

      delivered: allDeliveries.filter(
        (delivery) => delivery.status === "delivered",
      ).length,

      active: allDeliveries.length,
    }),
    [allDeliveries],
  );
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "rider") {
    return <Navigate to="/dashboard" replace />;
  }

  async function verifyPickupQr(delivery: Delivery, qrToken: string) {
    if (!token) {
      throw new Error("Authentication required");
    }

    if (!navigator.onLine) {
      throw new Error("Internet access is required to verify pickup.");
    }

    const location = await getLocation();

    setBusyId(delivery.id);

    setError("");

    try {
      await verifyPickup(token, delivery.id, {
        scanned_pickup_qr_token: qrToken,

        version: delivery.version,

        client_event_id: crypto.randomUUID(),

        ...location,
      });

      await loadDeliveries();
    } catch (error) {
      await loadDeliveries();

      throw error;
    } finally {
      setBusyId(null);
    }
  }

  async function completeDelivery(delivery: Delivery, qrToken: string) {
    if (!token) {
      throw new Error("Authentication required");
    }

    if (!navigator.onLine) {
      throw new Error(
        "Internet access is required to verify the delivery QR code.",
      );
    }

    const cleanedToken = qrToken
      .trim()
      .replace(/[\r\n\t]/g, "")
      .replace(/\s+/g, "");

    if (!cleanedToken) {
      throw new Error("Delivery QR token is empty.");
    }

    setBusyId(delivery.id);

    setError("");

    try {
      await verifyDelivery(token, delivery.id, {
        scanned_delivery_qr_token: cleanedToken,

        version: delivery.version,
      });

      await loadDeliveries();
    } catch (error) {
      await loadDeliveries();

      throw error;
    } finally {
      setBusyId(null);
    }
  }
  function openPickupScanner(delivery: Delivery) {
    setSelectedDelivery(delivery);

    setScanMode("pickup");

    setScannerOpen(true);
  }

  function openDeliveryScanner(delivery: Delivery) {
    setSelectedDelivery(delivery);

    setScanMode("delivery");

    setScannerOpen(true);
  }

  async function handleScan(value: string) {
    if (!selectedDelivery) {
      return;
    }

    setScannerOpen(false);

    if (scanMode === "pickup") {
      await verifyPickupQr(selectedDelivery, value);

      return;
    }

    await completeDelivery(selectedDelivery, value);
  }
  function discardQueue() {
    const confirmed = window.confirm(
      "Discard all legacy unsynchronized rider events?",
    );

    if (!confirmed) {
      return;
    }

    clearOfflineQueue(riderId);

    setQueueCount(0);

    void loadDeliveries();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark small">R</div>

          <div>
            <strong>Reflex Rider</strong>

            <span>{user.name}</span>
          </div>
        </div>

        <button className="secondary-button" onClick={logout}>
          Sign out
        </button>
      </header>

      <main className="rider-page">
        <header className="rider-heading">
          <div>
            <p className="eyebrow">Rider Operations</p>

            <h1>My Deliveries</h1>

            <p className="muted">
              Verify pickup, transport and complete your assigned jobs.
            </p>
          </div>

          <span className={online ? "network online" : "network offline"}>
            ● {online ? "Online" : "Offline"}
          </span>
        </header>

        <RiderStatsCards
          stats={counts}
          selected={selectedStatus}
          onSelect={(status) => {
            setSelectedStatus(status);

            void loadDeliveries(status || undefined);
          }}
        />

        {!online && (
          <section className="offline-banner">
            <div>
              <strong>Pickup verification unavailable offline</strong>

              <span>
                Reconnect to the internet before scanning a retailer pickup QR.
              </span>
            </div>
          </section>
        )}

        {queueCount > 0 && (
          <section className="offline-banner">
            <div>
              <strong>
                {queueCount} legacy offline event
                {queueCount === 1 ? "" : "s"} waiting
              </strong>

              <span>These were created by an older rider workflow.</span>
            </div>

            <div>
              {online && (
                <button
                  className="primary-button"
                  onClick={() => void flushQueue()}
                >
                  Sync now
                </button>
              )}

              <button className="danger-button" onClick={discardQueue}>
                Discard
              </button>
            </div>
          </section>
        )}

        {error && <div className="error-box">{error}</div>}

        <div className="panel-heading rider-toolbar">
          <strong>
            {selectedStatus
              ? `${deliveries.length} ${selectedStatus.replace("_", " ")} jobs`
              : `${deliveries.length} active jobs`}
          </strong>

          <button
            className="secondary-button"
            onClick={() => void loadDeliveries(selectedStatus || undefined)}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="empty-state">No active deliveries.</div>
        ) : (
          <RiderOrdersTable
            deliveries={deliveries}
            busyId={busyId}
            selectedStatus={selectedStatus}
            onPickup={openPickupScanner}
            onDelivery={openDeliveryScanner}
          />
        )}
        {scannerOpen && (
          <QrScanner
            title={
              scanMode === "pickup" ? "Scan Pickup QR" : "Scan Delivery QR"
            }
            instruction={
              scanMode === "pickup"
                ? "Scan the retailer pickup QR code."
                : "Scan the customer delivery QR code."
            }
            onScan={handleScan}
            onCancel={() => {
              setScannerOpen(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
