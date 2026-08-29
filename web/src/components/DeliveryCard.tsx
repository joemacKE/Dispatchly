import { useState } from "react";

import { QRCodeSVG } from "qrcode.react";

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

  const [showQr, setShowQr] = useState(false);

  const [error, setError] = useState("");

  async function revealQr() {
    setError("");

    if (qrToken) {
      setShowQr(true);
      return;
    }

    setQrLoading(true);

    try {
      const token = await onGetQr(delivery.id);

      setQrToken(token);
      setShowQr(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load QR code",
      );
    } finally {
      setQrLoading(false);
    }
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

              if (!riderId) {
                return;
              }

              void onAssign(delivery, riderId);
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
          {!showQr ? (
            <button
              type="button"
              className="secondary-button"
              disabled={qrLoading}
              onClick={() => void revealQr()}
            >
              {qrLoading ? "Loading QR..." : "Show Delivery QR"}
            </button>
          ) : (
            <div className="customer-qr">
              <div className="qr-image">
                <QRCodeSVG
                  value={qrToken}
                  size={220}
                  level="H"
                  marginSize={2}
                />
              </div>

              <div className="qr-information">
                <strong>Delivery QR</strong>

                <span>
                  Present this code to the rider when the package arrives.
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowQr(false)}
                >
                  Hide QR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
    </article>
  );
}
