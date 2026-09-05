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
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanQrValue(value: string) {
  let cleaned = value
    .trim()
    .replace(/[\r\n\t]/g, "")
    .replace(/\s+/g, "");

  if (cleaned.includes("/")) {
    cleaned = cleaned.split("/").pop()?.trim() || cleaned;
  }

  return cleaned;
}

export default function RiderDeliveryCard({
  delivery,
  busy,
  online,
  onVerifyPickup,
  onComplete,
}: Props) {
  const [showScanner, setShowScanner] = useState(false);

  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);

  const [scanMode, setScanMode] = useState<ScanMode>("pickup");

  const [deliveryToken, setDeliveryToken] = useState("");

  const [recipient, setRecipient] = useState("");

  const [error, setError] = useState("");

  const verifyPickupQr = useCallback(
    async (value: string) => {
      if (!online) {
        setError("Internet connection is required.");

        return;
      }

      const cleaned = cleanQrValue(value);

      if (!cleaned) {
        setError("Invalid pickup QR code.");

        return;
      }

      try {
        await onVerifyPickup(delivery, cleaned);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Pickup verification failed",
        );
      }
    },
    [delivery, online, onVerifyPickup],
  );

  const handleScan = useCallback(
    (value: string) => {
      const cleaned = cleanQrValue(value);

      setShowScanner(false);

      if (!cleaned) {
        setError("Invalid QR code.");

        return;
      }

      if (scanMode === "pickup") {
        void verifyPickupQr(cleaned);

        return;
      }

      setDeliveryToken(cleaned);

      setShowDeliveryConfirm(true);
    },
    [scanMode, verifyPickupQr],
  );

  async function confirmDelivery() {
    try {
      await onComplete(delivery, deliveryToken, recipient.trim());

      setDeliveryToken("");

      setRecipient("");

      setShowDeliveryConfirm(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Delivery confirmation failed",
      );
    }
  }

  function openScanner(mode: ScanMode) {
    setError("");

    setScanMode(mode);

    setShowScanner(true);
  }

  return (
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
      </div>

      <div className="card-actions">
        {delivery.status === "assigned" && (
          <button
            className="primary-button"
            disabled={busy || !online}
            onClick={() => openScanner("pickup")}
          >
            {busy ? "Verifying..." : "Verify Pickup"}
          </button>
        )}

        {delivery.status === "in_transit" && (
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => openScanner("delivery")}
          >
            Complete Delivery
          </button>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {showDeliveryConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="scanner-close"
              onClick={() => setShowDeliveryConfirm(false)}
            >
              ×
            </button>

            <h3>Confirm Delivery</h3>

            <p>Delivery QR scanned successfully.</p>

            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Recipient name (optional)"
            />

            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void confirmDelivery()}
            >
              {busy ? "Confirming..." : "Mark Delivered"}
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <QrScanner
          title={scanMode === "pickup" ? "Verify Pickup" : "Complete Delivery"}
          instruction={
            scanMode === "pickup"
              ? "Scan the retailer pickup QR code."
              : "Scan the customer delivery QR code."
          }
          onScan={handleScan}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </article>
  );
}
