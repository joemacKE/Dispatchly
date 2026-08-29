import { useState } from "react";

import type { Delivery, Rider } from "../types";

type Props = {
  delivery: Delivery;

  riders: Rider[];

  isDispatcher: boolean;

  onAssign: (delivery: Delivery, riderId: string) => Promise<void>;

  onGetQr: (deliveryId: string) => Promise<string>;
};

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default function DeliveryCard({
  delivery,
  riders,
  isDispatcher,
  onAssign,
  onGetQr,
}: Props) {
  const [qrToken, setQrToken] = useState("");

  const [qrLoading, setQrLoading] = useState(false);

  const [error, setError] = useState("");

  async function revealQr() {
    setQrLoading(true);
    setError("");

    try {
      const token = await onGetQr(delivery.id);

      setQrToken(token);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load QR token",
      );
    } finally {
      setQrLoading(false);
    }
  }

  async function copyQr() {
    if (!qrToken) {
      return;
    }

    await navigator.clipboard.writeText(qrToken);
  }

  return (
    <article className="delivery-card">
      <div className="card-heading">
        <div>
          <h3>{delivery.customer_name}</h3>

          <span className="muted">{delivery.customer_address}</span>
        </div>

        <span className={`status status-${delivery.status}`}>
          {statusLabel(delivery.status)}
        </span>
      </div>

      <div className="delivery-grid">
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

        <div>
          <small>Rider</small>
          <strong>{delivery.rider_name || "Not assigned"}</strong>
        </div>
      </div>

      {isDispatcher && delivery.status === "pending" && (
        <div className="card-actions">
          <select
            defaultValue=""
            onChange={(event) => {
              const riderId = event.target.value;

              if (riderId) {
                void onAssign(delivery, riderId);
              }
            }}
          >
            <option value="">Assign rider...</option>

            {riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.name}
                {" — "}
                {rider.phone}
              </option>
            ))}
          </select>
        </div>
      )}

      {delivery.status !== "cancelled" && (
        <div className="qr-section">
          {!qrToken ? (
            <button
              className="secondary-button"
              disabled={qrLoading}
              onClick={() => void revealQr()}
            >
              {qrLoading ? "Loading..." : "Reveal QR token"}
            </button>
          ) : (
            <>
              <code className="qr-token">{qrToken}</code>

              <button
                className="secondary-button"
                onClick={() => void copyQr()}
              >
                Copy token
              </button>
            </>
          )}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
    </article>
  );
}
