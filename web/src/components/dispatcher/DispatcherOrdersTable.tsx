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

export default function DispatcherOrdersTable({
  orders,

  onAssign,
}: Props) {
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
                <span className={`status-badge ${order.status}`}>
                  {formatStatus(order.status)}
                </span>
              </td>

              <td>
                {order.rider_name ? (
                  order.rider_name
                ) : (
                  <span className="muted">Not assigned</span>
                )}
              </td>

              <td>{formatDate(order.created_at)}</td>

              <td>
                {order.status === "pending" && (
                  <button
                    className="primary-button"
                    onClick={() => onAssign(order)}
                  >
                    Assign Rider
                  </button>
                )}

                {order.status !== "pending" && (
                  <span className="muted">In Progress</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
