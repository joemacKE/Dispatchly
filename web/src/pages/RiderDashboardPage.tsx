import { useCallback, useEffect, useMemo, useState } from "react";

import { Navigate } from "react-router-dom";

import {
  getMyDeliveries,
  submitProofOfDelivery,
  syncOfflineEvents,
  updateRiderStatus,
  type OfflineSyncEvent,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

import RiderDeliveryCard from "../components/RiderDeliveryCard";

import {
  addOfflineEvent,
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

  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [online, setOnline] = useState(navigator.onLine);

  const [queueCount, setQueueCount] = useState(getOfflineQueue(riderId).length);

  const loadDeliveries = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await getMyDeliveries(token);

      setDeliveries(result.deliveries);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load rider deliveries",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

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
          `${remaining.length} offline event(s) require attention because the server reported a conflict or rejection.`,
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
    void loadDeliveries();
  }, [loadDeliveries]);

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
      assigned: deliveries.filter((delivery) => delivery.status === "assigned")
        .length,

      pickedUp: deliveries.filter((delivery) => delivery.status === "picked_up")
        .length,

      inTransit: deliveries.filter(
        (delivery) => delivery.status === "in_transit",
      ).length,
    }),
    [deliveries],
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "rider") {
    return <Navigate to="/dashboard" replace />;
  }

  async function changeStatus(
    delivery: Delivery,
    toStatus: "picked_up" | "in_transit",
  ) {
    if (!token) {
      return;
    }

    const location = await getLocation();

    const offlineEvent: OfflineSyncEvent = {
      client_event_id: crypto.randomUUID(),

      delivery_request_id: delivery.id,

      to_status: toStatus,

      version: delivery.version,

      occurred_at: new Date().toISOString(),

      note:
        toStatus === "picked_up"
          ? "Pickup confirmed by rider"
          : "Rider started delivery",

      ...location,
    };

    function applyLocal() {
      setDeliveries((current) =>
        current.map((item) =>
          item.id === delivery.id
            ? {
                ...item,

                status: toStatus,

                version: item.version + 1,
              }
            : item,
        ),
      );
    }

    if (!navigator.onLine) {
      const queue = addOfflineEvent(riderId, offlineEvent);

      setQueueCount(queue.length);

      applyLocal();

      return;
    }

    setBusyId(delivery.id);

    setError("");

    try {
      const result = await updateRiderStatus(token, delivery.id, {
        to_status: toStatus,

        version: delivery.version,

        client_event_id: offlineEvent.client_event_id,

        note: offlineEvent.note,

        ...location,
      });

      setDeliveries((current) =>
        current.map((item) =>
          item.id === delivery.id
            ? {
                ...item,

                ...(result.delivery || {}),

                status: toStatus,

                version:
                  typeof result.version === "number"
                    ? result.version
                    : item.version + 1,
              }
            : item,
        ),
      );
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        const queue = addOfflineEvent(riderId, offlineEvent);

        setQueueCount(queue.length);

        applyLocal();
      } else {
        setError(
          error instanceof Error ? error.message : "Unable to update delivery",
        );

        await loadDeliveries();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function completeDelivery(
    delivery: Delivery,
    qrToken: string,
    recipient: string,
  ) {
    if (!token) {
      return;
    }

    if (!navigator.onLine) {
      throw new Error(
        "Internet access is required to verify the delivery QR code.",
      );
    }

    setBusyId(delivery.id);

    try {
      await submitProofOfDelivery(token, delivery.id, {
        scanned_qr_token: qrToken,

        version: delivery.version,

        client_event_id: crypto.randomUUID(),

        recipient_name: recipient || undefined,
      });

      await loadDeliveries();
    } finally {
      setBusyId(null);
    }
  }

  function discardQueue() {
    const confirmed = window.confirm(
      "Discard all unsynchronized rider events?",
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
              Pickup, transport and complete your assigned jobs.
            </p>
          </div>

          <span className={online ? "network online" : "network offline"}>
            ● {online ? "Online" : "Offline"}
          </span>
        </header>

        <section className="rider-stats">
          <article>
            <span>Assigned</span>

            <strong>{counts.assigned}</strong>
          </article>

          <article>
            <span>Picked Up</span>

            <strong>{counts.pickedUp}</strong>
          </article>

          <article>
            <span>In Transit</span>

            <strong>{counts.inTransit}</strong>
          </article>
        </section>

        {queueCount > 0 && (
          <section className="offline-banner">
            <div>
              <strong>
                {queueCount} offline event
                {queueCount === 1 ? "" : "s"} waiting to sync
              </strong>

              <span>They will synchronize when connectivity returns.</span>
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
            {deliveries.length} active job
            {deliveries.length === 1 ? "" : "s"}
          </strong>

          <button
            className="secondary-button"
            onClick={() => void loadDeliveries()}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="empty-state">No active deliveries.</div>
        ) : (
          <div className="delivery-list">
            {deliveries.map((delivery) => (
              <RiderDeliveryCard
                key={delivery.id}
                delivery={delivery}
                busy={busyId === delivery.id}
                onStatusChange={changeStatus}
                onComplete={completeDelivery}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
