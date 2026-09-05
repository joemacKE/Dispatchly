import type { Delivery } from "../../types";

type Props = {
  deliveries: Delivery[];

  busyId: string | null;

  onPickup: (delivery: Delivery) => void;

  onDelivery: (delivery: Delivery) => void;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString();
}

export default function RiderOrdersTable({
  deliveries,
  busyId,
  onPickup,
  onDelivery,
}: Props) {
  if (!deliveries.length) {
    return <div className="empty-state">No deliveries found.</div>;
  }

  return (
    <div className="rider-table-container">
      <table className="rider-orders-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Package</th>
            <th>Address</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {deliveries.map((delivery, index) => (
            <tr key={delivery.id}>
              <td>{index + 1}</td>

              <td>
                <div className="customer-cell">
                  <strong>{delivery.customer_name}</strong>
                  <span>{delivery.customer_phone}</span>
                </div>
              </td>

              <td>{delivery.item_description}</td>

              <td>{delivery.customer_address}</td>

              <td>
                <span className={`status-badge ${delivery.status}`}>
                  {formatStatus(delivery.status)}
                </span>
              </td>

              <td>{formatDate(delivery.created_at)}</td>

              <td>
                {delivery.status === "assigned" && (
                  <button
                    className="primary-button table-action"
                    disabled={busyId === delivery.id}
                    onClick={() => onPickup(delivery)}
                  >
                    {busyId === delivery.id ? "Scanning..." : "Scan Pickup QR"}
                  </button>
                )}

                {delivery.status === "in_transit" && (
                  <button
                    className="primary-button table-action"
                    disabled={busyId === delivery.id}
                    onClick={() => onDelivery(delivery)}
                  >
                    {busyId === delivery.id
                      ? "Scanning..."
                      : "Scan Delivery QR"}
                  </button>
                )}

                {delivery.status === "delivered" && (
                  <span className="completed-label">Completed ✓</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
