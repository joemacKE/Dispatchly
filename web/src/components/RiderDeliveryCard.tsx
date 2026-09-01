import { useCallback, useState } from "react";

import QrScanner from "./QrScanner";

import type { Delivery } from "../types";

type ScanMode = "pickup" | "delivery";

type Props = {
  delivery: Delivery;

  busy: boolean;

  online: boolean;

  onVerifyPickup: (delivery: Delivery, qrToken: string) => Promise<void>;

  onComplete: (
    delivery: Delivery,
    qrToken: string,
    recipientName: string,
  ) => Promise<void>;
};

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default function RiderDeliveryCard({
  delivery,
  busy,
  online,
  onVerifyPickup,
  onComplete,
}: Props) {
  const [showPod, setShowPod] = useState(false);

  const [showScanner, setShowScanner] = useState(false);

  const [scanMode, setScanMode] = useState<ScanMode>("delivery");

  const [qrToken, setQrToken] = useState("");

  const [recipient, setRecipient] = useState("");

  const [error, setError] = useState("");

  async function verifyPickupQr(value: string) {
    setError("");

    if (!online) {
      setError("Internet access is required to verify pickup.");

      return;
    }

    if (!value.trim()) {
      setError("The scanned pickup QR code is empty.");

      return;
    }

    try {
      await onVerifyPickup(delivery, value.trim());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to verify pickup",
      );
    }
  }

  const handleScan = useCallback(
    (value: string) => {
      console.log("SCANNED QR VALUE:", value);
      setShowScanner(false);

      if (scanMode === "pickup") {
        void verifyPickupQr(value);

        return;
      }

      setQrToken(value);

      setShowPod(true);

      setError("");
    },
    [scanMode, delivery, online, onVerifyPickup],
  );

  async function complete() {
    setError("");

    if (!qrToken.trim()) {
      setError("Scan the customer's delivery QR code first.");

      return;
    }

    try {
      await onComplete(delivery, qrToken.trim(), recipient.trim());

      setShowPod(false);

      setQrToken("");

      setRecipient("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to complete delivery",
      );
    }
  }

  function openPickupScanner() {
    setError("");

    if (!online) {
      setError("Internet access is required to verify pickup.");

      return;
    }

    setScanMode("pickup");

    setShowScanner(true);
  }

  function openDeliveryScanner() {
    setError("");

    setScanMode("delivery");

    setShowScanner(true);
  }

  return (
    <>
      <article className="rider-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">Delivery</span>

            <h3>{delivery.customer_name}</h3>

            <span className="muted">{delivery.customer_address}</span>
          </div>

          <span className={`status status-${delivery.status}`}>
            {statusLabel(delivery.status)}
          </span>
        </div>

        <div className="delivery-grid rider-details">
          <div>
            <small>Phone</small>

            <strong>{delivery.customer_phone}</strong>
          </div>

          <div>
            <small>Package</small>

            <strong>{delivery.item_description}</strong>
          </div>

          <div>
            <small>Version</small>

            <strong>{delivery.version}</strong>
          </div>
        </div>

        {delivery.status === "assigned" && (
          <div className="pod-box">
            <div>
              <strong>Pickup verification required</strong>

              <p className="muted">
                Scan the pickup QR displayed by the retailer before taking
                custody of this package.
              </p>
            </div>
          </div>
        )}

        <div className="card-actions">
          {delivery.status === "assigned" && (
            <button
              type="button"
              className="primary-button"
              disabled={busy || !online}
              onClick={openPickupScanner}
            >
              {busy
                ? "Verifying..."
                : online
                  ? "Scan Pickup QR"
                  : "Internet Required"}
            </button>
          )}

          {delivery.status === "in_transit" && (
            <button
              type="button"
              className="primary-button"
              disabled={busy}
              onClick={openDeliveryScanner}
            >
              Scan Delivery QR
            </button>
          )}
        </div>

        {delivery.status === "picked_up" && (
          <div className="error-box">
            This delivery is in a legacy pickup state. Refresh the dashboard or
            contact dispatch before continuing.
          </div>
        )}

        {showPod && delivery.status === "in_transit" && (
          <div className="pod-box">
            <div className="pod-success">
              <span>✓</span>

              <div>
                <strong>Delivery QR scanned</strong>

                <p>Confirm the recipient and submit proof of delivery.</p>
              </div>
            </div>

            <label>
              Recipient name
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Optional"
              />
            </label>

            {error && <div className="error-box">{error}</div>}

            <div className="pod-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => {
                  setShowPod(false);

                  setQrToken("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() => void complete()}
              >
                {busy ? "Confirming..." : "Mark Delivered"}
              </button>
            </div>
          </div>
        )}

        {error && !showPod && <div className="error-box">{error}</div>}
      </article>

      {showScanner && (
        <QrScanner
          title={scanMode === "pickup" ? "Scan Pickup QR" : "Scan Delivery QR"}
          instruction={
            scanMode === "pickup"
              ? "Point the camera at the retailer's Reflex pickup QR code."
              : "Point the camera at the customer's Reflex delivery QR code."
          }
          onScan={handleScan}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
