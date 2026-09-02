import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrdersTable({ orders }: Props) {
  if (!orders.length) {
    return <div className="empty-state">No orders found.</div>;
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
            <th>Payment</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
