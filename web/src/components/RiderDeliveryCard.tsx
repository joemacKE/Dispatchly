import { useState } from "react";

import type { Delivery } from "../types";

type Props = {
  delivery: Delivery;

  busy: boolean;

  onStatusChange: (
    delivery: Delivery,
    status: "picked_up" | "in_transit",
  ) => Promise<void>;

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
  onStatusChange,
  onComplete,
}: Props) {
  const [showPod, setShowPod] = useState(false);

  const [qrToken, setQrToken] = useState("");

  const [recipient, setRecipient] = useState("");

  const [error, setError] = useState("");

  async function complete() {
    setError("");

    if (!qrToken.trim()) {
      setError("Enter the delivery QR token.");

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
            disabled={busy}
            onClick={() => void onStatusChange(delivery, "picked_up")}
          >
            {busy ? "Updating..." : "Confirm Pickup"}
          </button>
        )}

        {delivery.status === "picked_up" && (
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void onStatusChange(delivery, "in_transit")}
          >
            {busy ? "Updating..." : "Start Delivery"}
          </button>
        )}

        {delivery.status === "in_transit" && (
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => setShowPod((value) => !value)}
          >
            Confirm Delivery
          </button>
        )}
      </div>

      {showPod && delivery.status === "in_transit" && (
        <div className="pod-box">
          <h4>Proof of Delivery</h4>

          <label>
            QR token
            <textarea
              value={qrToken}
              onChange={(event) => setQrToken(event.target.value)}
              placeholder="Paste delivery QR token"
            />
          </label>

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
              className="secondary-button"
              disabled={busy}
              onClick={() => setShowPod(false)}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void complete()}
            >
              {busy ? "Confirming..." : "Mark Delivered"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
