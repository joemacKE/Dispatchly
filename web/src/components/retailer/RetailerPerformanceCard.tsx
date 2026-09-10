import {
  faChartLine,
  faCircleCheck,
  faClock,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  stats: {
    pending: number;
    assigned: number;
    in_transit: number;
    delivered: number;
  };
};

export default function RetailerPerformanceCard({ stats }: Props) {
  const total =
    stats.pending + stats.assigned + stats.in_transit + stats.delivered;

  const completion =
    total === 0 ? 0 : Math.round((stats.delivered / total) * 100);

  return (
    <div className="retailer-intelligence-card">
      <div className="intelligence-header">
        <div>
          <h3>Delivery Performance</h3>

          <p>Current delivery completion rate</p>
        </div>

        <FontAwesomeIcon icon={faChartLine} />
      </div>

      <div className="completion-number">{completion}%</div>

      <div className="progress-track">
        <div
          className="progress-value"
          style={{
            width: `${completion}%`,
          }}
        />
      </div>

      <div className="performance-breakdown">
        <div>
          <FontAwesomeIcon icon={faCircleCheck} />
          Delivered
          <strong>{stats.delivered}</strong>
        </div>

        <div>
          <FontAwesomeIcon icon={faTruckFast} />
          Transit
          <strong>{stats.in_transit}</strong>
        </div>

        <div>
          <FontAwesomeIcon icon={faClock} />
          Pending
          <strong>{stats.pending}</strong>
        </div>
      </div>
    </div>
  );
}
