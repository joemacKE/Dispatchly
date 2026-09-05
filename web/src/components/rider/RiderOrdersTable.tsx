import type { Delivery } from "../../types";

type Props = {
  deliveries: Delivery[];

  busyId: string | null;

  online: boolean;

  onPickup: (delivery: Delivery) => void;

  onDelivery: (delivery: Delivery) => void;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RiderOrdersTable({
  deliveries,

  busyId,

  online,

  onPickup,

  onDelivery,
}: Props) {
  return (
    <div className="orders-table-wrapper">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Customer</th>

            <th>Phone</th>

            <th>Package</th>

            <th>Status</th>

            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>
                <strong>{delivery.customer_name}</strong>

                <br />

                <small>{delivery.customer_address}</small>
              </td>

              <td>{delivery.customer_phone}</td>

              <td>{delivery.item_description}</td>

              <td>
                <span className={`status-badge ${delivery.status}`}>
                  {formatStatus(delivery.status)}
                </span>
              </td>

              <td>
                {delivery.status === "assigned" && (
                  <button
                    className="primary-button"
                    disabled={busyId === delivery.id || !online}
                    onClick={() => onPickup(delivery)}
                  >
                    Verify Pickup
                  </button>
                )}

                {delivery.status === "in_transit" && (
                  <button
                    className="primary-button"
                    disabled={busyId === delivery.id}
                    onClick={() => onDelivery(delivery)}
                  >
                    Complete Delivery
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
