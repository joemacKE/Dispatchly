import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTriangleExclamation,
  faClock,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];

  onAssign?: (delivery: Delivery) => void;
};

export default function DispatcherPriorityQueue({ orders, onAssign }: Props) {
  const now = Date.now();

  const priorityOrders = orders
    .filter((order) => order.status !== "delivered")
    .map((order) => {
      const createdTime = order.created_at
        ? new Date(order.created_at).getTime()
        : now;

      const ageMinutes = Math.floor((now - createdTime) / 60000);

      let priority: "critical" | "attention" | "normal" = "normal";

      if (order.status === "pending" && ageMinutes >= 60) {
        priority = "critical";
      } else if (order.status === "pending" && ageMinutes >= 30) {
        priority = "attention";
      }

      return {
        ...order,
        ageMinutes,
        priority,
      };
    })
    .filter((order) => order.priority !== "normal")
    .slice(0, 5);

  return (
    <section className="dispatcher-priority-card">
      <div className="dispatcher-priority-header">
        <div>
          <h2>Priority Queue</h2>

          <p>Deliveries requiring attention</p>
        </div>

        <div className="priority-alert-count">
          {priorityOrders.length} alerts
        </div>
      </div>

      {priorityOrders.length === 0 ? (
        <div className="priority-empty">
          <p>No urgent deliveries</p>
        </div>
      ) : (
        <div className="priority-items">
          {priorityOrders.map((order) => (
            <div
              key={order.id}
              className={`
                      priority-delivery-item
                      ${order.priority}
                    `}
            >
              <div className="priority-info">
                <div className="priority-title-row">
                  <h3>{order.customer_name}</h3>

                  <span
                    className={`
                            priority-status
                            ${order.priority}
                          `}
                  >
                    <FontAwesomeIcon icon={faTriangleExclamation} />

                    {order.priority}
                  </span>
                </div>

                <div className="priority-detail">
                  <FontAwesomeIcon icon={faLocationDot} />

                  <span>{order.customer_address}</span>
                </div>

                <div className="priority-detail">
                  <FontAwesomeIcon icon={faClock} />

                  <span>Waiting {order.ageMinutes} minutes</span>
                </div>
              </div>

              <button
                className="priority-action-button"
                onClick={() => onAssign?.(order)}
              >
                Assign Rider
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
