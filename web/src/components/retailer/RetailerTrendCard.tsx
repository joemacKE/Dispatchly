import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];
};

export default function RetailerTrendCard({ orders }: Props) {
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),

      label: date.toLocaleDateString("en-KE", {
        weekday: "short",
      }),

      count: 0,
    };
  });

  for (const order of orders) {
    if (!order.created_at) {
      continue;
    }

    const createdDate = new Date(order.created_at);

    const key = createdDate.toISOString().slice(0, 10);

    const day = days.find((item) => item.key === key);

    if (day) {
      day.count += 1;
    }
  }

  const maxCount = Math.max(...days.map((day) => day.count), 1);

  return (
    <div className="retailer-intelligence-card">
      <div className="intelligence-header">
        <div>
          <h3>Order Trends</h3>

          <p>Delivery requests created over the last 7 days</p>
        </div>

        <FontAwesomeIcon icon={faChartLine} />
      </div>

      <div className="trend-chart">
        {days.map((day) => (
          <div className="trend-column" key={day.key}>
            <div className="trend-value">{day.count}</div>

            <div className="trend-bar-track">
              <div
                className="trend-bar"
                style={{
                  height: `${(day.count / maxCount) * 100}%`,
                }}
              />
            </div>

            <span>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
