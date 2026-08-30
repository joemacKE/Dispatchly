import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  getMyDeliveries,
  submitProofOfDelivery,
  syncOfflineEvents,
  verifyPickup,
} from "../api/client";

import {
  useAuth,
} from "../auth/AuthContext";

import RiderDeliveryCard from "../components/RiderDeliveryCard";

import {
  clearOfflineQueue,
  getOfflineQueue,
  saveOfflineQueue,
} from "../rider/offlineQueue";

import type {
  Delivery,
} from "../types";

function getLocation(): Promise<{
  lat?: number;
  lng?: number;
}> {
  return new Promise(
    (resolve) => {
      if (
        !navigator.geolocation
      ) {
        resolve({});

        return;
      }

      navigator.geolocation
        .getCurrentPosition(
          (position) => {
            resolve({
              lat:
                position.coords
                  .latitude,

              lng:
                position.coords
                  .longitude,
            });
          },

          () => {
            resolve({});
          },

          {
            timeout: 5000,
            maximumAge: 60000,
          }
        );
    }
  );
}

export default function RiderDashboardPage() {
  const {
    token,
    user,
    logout,
  } = useAuth();

  const riderId =
    user?.id || "unknown";

  const [
    deliveries,
    setDeliveries,
  ] =
    useState<Delivery[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busyId,
    setBusyId,
  ] =
    useState<string | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [online, setOnline] =
    useState(
      navigator.onLine
    );

  const [
    queueCount,
    setQueueCount,
  ] = useState(
    getOfflineQueue(
      riderId
    ).length
  );

  const loadDeliveries =
    useCallback(async () => {
      if (!token) {
        return;
      }

      try {
        const result =
          await getMyDeliveries(
            token
          );

        setDeliveries(
          result.deliveries
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load rider deliveries"
        );
      } finally {
        setLoading(false);
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
  const flushQueue =
    useCallback(async () => {
      if (
        !token ||
        !navigator.onLine
      ) {
        return;
      }

      const queue =
        getOfflineQueue(
          riderId
        );

      if (!queue.length) {
        setQueueCount(0);

        return;
      }

      try {
        const result =
          await syncOfflineEvents(
            token,
            queue
          );

        const finished =
          new Set(
            result.results
              .filter(
                (item) =>
                  item.result ===
                    "applied" ||
                  item.result ===
                    "duplicate"
              )
              .map(
                (item) =>
                  item.client_event_id
              )
          );

        const remaining =
          queue.filter(
            (event) =>
              !finished.has(
                event.client_event_id
              )
          );

        saveOfflineQueue(
          riderId,
          remaining
        );

        setQueueCount(
          remaining.length
        );

        if (
          remaining.length
        ) {
          setError(
            `${remaining.length} legacy offline event(s) were rejected or conflicted. Pickup verification now requires an online QR scan.`
          );
        }

        await loadDeliveries();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Offline synchronization failed"
        );
      }
    }, [
      token,
      riderId,
      loadDeliveries,
    ]);

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

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, [flushQueue]);

  useEffect(() => {
    if (navigator.onLine) {
      void flushQueue();
    }
  }, [flushQueue]);

  const counts =
    useMemo(
      () => ({
        assigned:
          deliveries.filter(
            (delivery) =>
              delivery.status ===
              "assigned"
          ).length,

        inTransit:
          deliveries.filter(
            (delivery) =>
              delivery.status ===
              "in_transit"
          ).length,

        active:
          deliveries.length,
      }),
      [deliveries]
    );

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user.role !==
    "rider"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  async function verifyPickupQr(
    delivery: Delivery,
    qrToken: string
  ) {
    if (!token) {
      throw new Error(
        "Authentication required"
      );
    }

    if (!navigator.onLine) {
      throw new Error(
        "Internet access is required to verify pickup."
      );
    }

    const location =
      await getLocation();

    setBusyId(delivery.id);

    setError("");

    try {
      await verifyPickup(
        token,
        delivery.id,
        {
          scanned_pickup_qr_token:
            qrToken,

          version:
            delivery.version,

          client_event_id:
            crypto.randomUUID(),

          ...location,
        }
      );

      await loadDeliveries();
    } catch (error) {
      await loadDeliveries();

      throw error;
    } finally {
      setBusyId(null);
    }
  }

  async function completeDelivery(
    delivery: Delivery,
    qrToken: string,
    recipient: string
  ) {
    if (!token) {
      return;
    }

    if (!navigator.onLine) {
      throw new Error(
        "Internet access is required to verify the delivery QR code."
      );
    }

    setBusyId(delivery.id);

    try {
      await submitProofOfDelivery(
        token,
        delivery.id,
        {
          scanned_qr_token:
            qrToken,

          version:
            delivery.version,

          client_event_id:
            crypto.randomUUID(),

          recipient_name:
            recipient ||
            undefined,
        }
      );

      await loadDeliveries();
    } finally {
      setBusyId(null);
    }
  }

  function discardQueue() {
    const confirmed =
      window.confirm(
        "Discard all legacy unsynchronized rider events?"
      );

    if (!confirmed) {
      return;
    }

    clearOfflineQueue(
      riderId
    );

    setQueueCount(0);

    void loadDeliveries();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark small">
            R
          </div>

          <div>
            <strong>
              Reflex Rider
            </strong>

            <span>
              {user.name}
            </span>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={logout}
        >
          Sign out
        </button>
      </header>

      <main className="rider-page">
        <header className="rider-heading">
          <div>
            <p className="eyebrow">
              Rider Operations
            </p>

            <h1>
              My Deliveries
            </h1>

            <p className="muted">
              Verify pickup,
              transport and complete
              your assigned jobs.
            </p>
          </div>

          <span
            className={
              online
                ? "network online"
                : "network offline"
            }
          >
            ●{" "}
            {online
              ? "Online"
              : "Offline"}
          </span>
        </header>

        <section className="rider-stats">
          <article>
            <span>Assigned</span>

            <strong>
              {counts.assigned}
            </strong>
          </article>

          <article>
            <span>
              In Transit
            </span>

            <strong>
              {counts.inTransit}
            </strong>
          </article>

          <article>
            <span>
              Active Jobs
            </span>

            <strong>
              {counts.active}
            </strong>
          </article>
        </section>

        {!online && (
          <section className="offline-banner">
            <div>
              <strong>
                Pickup verification
                unavailable offline
              </strong>

              <span>
                Reconnect to the
                internet before
                scanning a retailer
                pickup QR.
              </span>
            </div>
          </section>
        )}

        {queueCount > 0 && (
          <section className="offline-banner">
            <div>
              <strong>
                {queueCount} legacy
                offline event
                {queueCount === 1
                  ? ""
                  : "s"}{" "}
                waiting
              </strong>

              <span>
                These were created by
                an older rider
                workflow.
              </span>
            </div>

            <div>
              {online && (
                <button
                  className="primary-button"
                  onClick={() =>
                    void flushQueue()
                  }
                >
                  Sync now
                </button>
              )}

              <button
                className="danger-button"
                onClick={
                  discardQueue
                }
              >
                Discard
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <div className="panel-heading rider-toolbar">
          <strong>
            {deliveries.length} active
            job
            {deliveries.length === 1
              ? ""
              : "s"}
          </strong>

          <button
            className="secondary-button"
            onClick={() =>
              void loadDeliveries()
            }
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading deliveries...
          </div>
        ) : deliveries.length ===
          0 ? (
          <div className="empty-state">
            No active deliveries.
          </div>
        ) : (
          <div className="delivery-list">
            {deliveries.map(
              (delivery) => (
                <RiderDeliveryCard
                  key={
                    delivery.id
                  }
                  delivery={
                    delivery
                  }
                  busy={
                    busyId ===
                    delivery.id
                  }
                  online={online}
                  onVerifyPickup={
                    verifyPickupQr
                  }
                  onComplete={
                    completeDelivery
                  }
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
