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

function cleanQrValue(value: string) {
  let cleaned = value
    .trim()
    .replace(/[\r\n\t]/g, "")
    .replace(/\s+/g, "");

  /*
   * Handles QR codes containing URLs.
   *
   * Example:
   * https://reflex.com/delivery/TOKEN
   *
   * becomes:
   * TOKEN
   */

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

  const [showPod, setShowPod] = useState(false);

  const [scanMode, setScanMode] = useState<ScanMode>("delivery");

  const [qrToken, setQrToken] = useState("");

  const [recipient, setRecipient] = useState("");

  const [error, setError] = useState("");

  /*
   * PICKUP QR VERIFICATION
   */

  const verifyPickupQr = useCallback(
    async (value: string) => {
      setError("");

      if (!online) {
        setError("Internet access is required to verify pickup.");

        return;
      }

      const cleaned = cleanQrValue(value);

      if (!cleaned) {
        setError("The scanned pickup QR code is empty.");

        return;
      }

      try {
        await onVerifyPickup(delivery, cleaned);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to verify pickup",
        );
      }
    },
    [online, delivery, onVerifyPickup],
  );

  /*
   * QR SCANNER CALLBACK
   */

  const handleScan = useCallback(
    (value: string) => {
      const cleaned = cleanQrValue(value);

      console.log("SCANNED QR VALUE:", cleaned);

      setShowScanner(false);

      if (!cleaned) {
        setError("The scanned QR code is empty.");

        return;
      }

      if (scanMode === "pickup") {
        void verifyPickupQr(cleaned);

        return;
      }

      /*
       * IMPORTANT:
       *
       * Store exactly the scanned
       * customer delivery token.
       */

      setQrToken(cleaned);

      setShowPod(true);

      setError("");
    },
    [scanMode, verifyPickupQr],
  );

  /*
   * COMPLETE DELIVERY
   */

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

    setScanMode("pickup");

    setShowScanner(true);
  }

  function openDeliveryScanner() {
    setError("");

    setScanMode("delivery");

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

        <div>
          <small>Version</small>

          <strong>{delivery.version}</strong>
        </div>
      </div>

      <div className="card-actions">
        {delivery.status === "assigned" && (
          <button
            className="primary-button"
            disabled={busy || !online}
            onClick={openPickupScanner}
          >
            {busy ? "Verifying..." : "Scan Pickup QR"}
          </button>
        )}

        {delivery.status === "in_transit" && (
          <button
            className="primary-button"
            disabled={busy}
            onClick={openDeliveryScanner}
          >
            Scan Delivery QR
          </button>
        )}
      </div>

      {showPod && delivery.status === "in_transit" && (
        <div className="pod-box">
          <strong>Delivery QR scanned</strong>

          <label>
            Recipient name
            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Optional"
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void complete()}
          >
            {busy ? "Confirming..." : "Mark Delivered"}
          </button>
        </div>
      )}

      {error && !showPod && <div className="error-box">{error}</div>}

      {showScanner && (
        <QrScanner
          title={scanMode === "pickup" ? "Scan Pickup QR" : "Scan Delivery QR"}
          instruction={
            scanMode === "pickup"
              ? "Point the camera at the retailer pickup QR code."
              : "Point the camera at the customer delivery QR code."
          }
          onScan={handleScan}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </article>
  );
}
