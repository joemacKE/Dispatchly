import {
  useEffect,
  useState,
} from "react";

import {
  QRCodeSVG,
} from "qrcode.react";

import type {
  Delivery,
  Rider,
} from "../types";

type Props = {
  delivery: Delivery;

  riders: Rider[];

  isDispatcher: boolean;

  isRetailer: boolean;

  onAssign: (
    delivery: Delivery,
    riderId: string
  ) => Promise<void>;

  onGetQr: (
    deliveryId: string
  ) => Promise<string>;

  onGetPickupQr: (
    deliveryId: string
  ) => Promise<string>;
};

function statusLabel(
  status: string
) {
  return status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (value) =>
        value.toUpperCase()
    );
}

export default function DeliveryCard({
  delivery,
  riders,
  isDispatcher,
  isRetailer,
  onAssign,
  onGetQr,
  onGetPickupQr,
}: Props) {
  const [
    deliveryQrToken,
    setDeliveryQrToken,
  ] = useState("");

  const [
    pickupQrToken,
    setPickupQrToken,
  ] = useState("");

  const [
    deliveryQrLoading,
    setDeliveryQrLoading,
  ] = useState(false);

  const [
    pickupQrLoading,
    setPickupQrLoading,
  ] = useState(false);

  const [
    showDeliveryQr,
    setShowDeliveryQr,
  ] = useState(false);

  const [
    showPickupQr,
    setShowPickupQr,
  ] = useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      delivery.status !==
      "assigned"
    ) {
      setShowPickupQr(false);

      setPickupQrToken("");
    }
  }, [delivery.status]);

  async function revealDeliveryQr() {
    setError("");

    if (deliveryQrToken) {
      setShowDeliveryQr(true);

      return;
    }

    setDeliveryQrLoading(true);

    try {
      const token =
        await onGetQr(
          delivery.id
        );

      setDeliveryQrToken(
        token
      );

      setShowDeliveryQr(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load delivery QR code"
      );
    } finally {
      setDeliveryQrLoading(
        false
      );
    }
  }

  async function revealPickupQr() {
    setError("");

    if (pickupQrToken) {
      setShowPickupQr(true);

      return;
    }

    setPickupQrLoading(true);

    try {
      const token =
        await onGetPickupQr(
          delivery.id
        );

      setPickupQrToken(token);

      setShowPickupQr(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load pickup QR code"
      );
    } finally {
      setPickupQrLoading(
        false
      );
    }
  }

  return (
    <article className="delivery-card">
      <div className="card-heading">
        <div>
          <h3>
            {
              delivery.customer_name
            }
          </h3>

          <span className="muted">
            {
              delivery.customer_address
            }
          </span>
        </div>

        <span
          className={
            `status status-${delivery.status}`
          }
        >
          {statusLabel(
            delivery.status
          )}
        </span>
      </div>

      <div className="delivery-grid">
        <div>
          <small>Phone</small>

          <strong>
            {
              delivery.customer_phone
            }
          </strong>
        </div>

        <div>
          <small>Package</small>

          <strong>
            {
              delivery.item_description
            }
          </strong>
        </div>

        <div>
          <small>Version</small>

          <strong>
            {delivery.version}
          </strong>
        </div>

        <div>
          <small>Rider</small>

          <strong>
            {delivery.rider_name ||
              "Not assigned"}
          </strong>
        </div>
      </div>

      {isDispatcher &&
        delivery.status ===
          "pending" && (
          <div className="card-actions">
            <select
              defaultValue=""
              onChange={(
                event
              ) => {
                const riderId =
                  event.target
                    .value;

                if (!riderId) {
                  return;
                }

                void onAssign(
                  delivery,
                  riderId
                );
              }}
            >
              <option value="">
                Assign rider...
              </option>

              {riders.map(
                (rider) => (
                  <option
                    key={
                      rider.id
                    }
                    value={
                      rider.id
                    }
                  >
                    {rider.name}
                    {" — "}
                    {rider.phone}
                  </option>
                )
              )}
            </select>
          </div>
        )}

      {isRetailer &&
        delivery.status ===
          "assigned" && (
          <div className="qr-section">
            {!showPickupQr ? (
              <button
                type="button"
                className="primary-button"
                disabled={
                  pickupQrLoading
                }
                onClick={() =>
                  void revealPickupQr()
                }
              >
                {pickupQrLoading
                  ? "Loading Pickup QR..."
                  : "Show Pickup QR"}
              </button>
            ) : (
              <div className="customer-qr">
                <div className="qr-image">
                  <QRCodeSVG
                    value={
                      pickupQrToken
                    }
                    size={220}
                    level="H"
                    marginSize={2}
                  />
                </div>

                <div className="qr-information">
                  <strong>
                    Pickup QR
                  </strong>

                  <span>
                    Show this code only
                    to the assigned
                    rider when handing
                    over the package.
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowPickupQr(
                        false
                      )
                    }
                  >
                    Hide Pickup QR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {delivery.status !==
        "cancelled" && (
        <div className="qr-section">
          {!showDeliveryQr ? (
            <button
              type="button"
              className="secondary-button"
              disabled={
                deliveryQrLoading
              }
              onClick={() =>
                void revealDeliveryQr()
              }
            >
              {deliveryQrLoading
                ? "Loading QR..."
                : "Show Delivery QR"}
            </button>
          ) : (
            <div className="customer-qr">
              <div className="qr-image">
                <QRCodeSVG
                  value={
                    deliveryQrToken
                  }
                  size={220}
                  level="H"
                  marginSize={2}
                />
              </div>

              <div className="qr-information">
                <strong>
                  Delivery QR
                </strong>

                <span>
                  Present this code
                  when confirming final
                  delivery.
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowDeliveryQr(
                      false
                    )
                  }
                >
                  Hide Delivery QR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}
    </article>
  );
}
