import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];
};

export default function RetailerLocationsCard({ orders }: Props) {
  const locationCounts = orders.reduce<Record<string, number>>(
    (accumulator, order) => {
      const location = order.customer_address?.trim();

      if (!location) {
        return accumulator;
      }

      accumulator[location] = (accumulator[location] ?? 0) + 1;

      return accumulator;
    },
    {},
  );

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const highestCount = Math.max(...locations.map(([, count]) => count), 1);

  return (
    <div className="retailer-intelligence-card">
      <div className="intelligence-header">
        <div>
          <h3>Top Delivery Locations</h3>

          <p>Most frequent customer destinations</p>
        </div>

        <FontAwesomeIcon icon={faLocationDot} />
      </div>

      {locations.length === 0 ? (
        <div className="analytics-empty-state">
          Location insights will appear as deliveries are created.
        </div>
      ) : (
        <div className="location-list">
          {locations.map(([location, count]) => (
            <div className="location-item" key={location}>
              <div className="location-row">
                <span>{location}</span>

                <strong>{count}</strong>
              </div>

              <div className="location-track">
                <div
                  className="location-progress"
                  style={{
                    width: `${(count / highestCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
