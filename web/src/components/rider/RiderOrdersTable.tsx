import type { Delivery } from "../../types";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTruck,
  faBox,
  faRoute,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  deliveries: Delivery[];

  busyId: string | null;

  selectedStatus?: string;

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

function EmptyDeliveryState({ status }: { status?: string }) {
  const emptyStates = {
    assigned: {
      icon: faBox,

      title: "No Assigned Deliveries",

      message: "There are currently no deliveries waiting for pickup.",
    },

    in_transit: {
      icon: faRoute,

      title: "No In Transit Deliveries",

      message: "There are currently no deliveries being transported.",
    },

    delivered: {
      icon: faCircleCheck,

      title: "No Delivered Deliveries",

      message: "Completed deliveries will appear here.",
    },

    default: {
      icon: faTruck,

      title: "No Active Deliveries",

      message: "There are currently no active delivery jobs.",
    },
  };

  const state =
    emptyStates[status as keyof typeof emptyStates] ?? emptyStates.default;

  return (
    <div className="empty-delivery-state">
      <div className="empty-delivery-icon">
        <FontAwesomeIcon icon={state.icon} />
      </div>

      <h3>{state.title}</h3>

      <p>{state.message}</p>
    </div>
  );
}

export default function RiderOrdersTable({
  deliveries,

  busyId,

  selectedStatus,

  onPickup,

  onDelivery,
}: Props) {
  if (!deliveries.length) {
    return <EmptyDeliveryState status={selectedStatus} />;
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
                  <span className="completed-label">
                    <FontAwesomeIcon icon={faCircleCheck} /> Completed
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
