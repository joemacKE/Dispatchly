import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];

  onPickupQr: (order: Delivery) => void;

  onDeliveryQr: (order: Delivery) => void;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrdersTable({
  orders,
  onPickupQr,
  onDeliveryQr,
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
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.customer_name}</strong>
              </td>

              <td>{order.customer_phone}</td>

              <td>{order.item_description}</td>

              <td>
                <span className={`status-badge ${order.status}`}>
                  {formatStatus(order.status)}
                </span>
              </td>

              <td>
                {order.payment_method
                  ? order.payment_method.replaceAll("_", " ")
                  : "-"}
              </td>

              <td>
                {order.status === "assigned" && (
                  <button
                    className="primary-button"
                    onClick={() => onPickupQr(order)}
                  >
                    Pickup QR
                  </button>
                )}

                {order.status === "in_transit" && (
                  <button
                    className="primary-button"
                    onClick={() => onDeliveryQr(order)}
                  >
                    Delivery QR
                  </button>
                )}

                {order.status === "delivered" && (
                  <span className="muted">Completed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
