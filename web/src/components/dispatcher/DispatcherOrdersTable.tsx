import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];
  onAssign: (delivery: Delivery) => void;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DispatcherOrdersTable({ orders, onAssign }: Props) {
  console.log("DispatcherOrdersTable loaded");

  if (orders.length === 0) {
    return <div className="empty-state">No deliveries found.</div>;
  }

  return (
    <div className="orders-table-wrapper">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Package</th>
            <th>Status</th>
            <th>Rider</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.customer_name}</strong>

                <br />

                <small>{order.customer_address}</small>
              </td>

              <td>{order.customer_phone}</td>

              <td>{order.item_description}</td>

              <td>
                <div className="status-action">
                  <span className={`status-badge ${order.status}`}>
                    {formatStatus(order.status)}
                  </span>

                  {order.status === "pending" && (
                    <button
                      type="button"
                      className="status-dropdown-button"
                      onClick={() => onAssign(order)}
                    >
                      ▼
                    </button>
                  )}
                </div>
              </td>

              <td>
                {order.rider_name ?? (
                  <span className="muted">Not assigned</span>
                )}
              </td>

              <td>{formatDate(order.created_at)}</td>

              <td>
                {order.status === "pending" ? (
                  <span className="muted">Awaiting assignment</span>
                ) : (
                  <span className="muted">Active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
