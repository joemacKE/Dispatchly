import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUserCheck,
  faUserClock,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";

import type { Rider } from "../../types";

type Props = {
  riders: Rider[];
};

export default function DispatcherRiderStatus({ riders }: Props) {
  const availableRiders = riders.filter(
    (rider) => rider.availability === "available",
  );

  const busyRiders = riders.filter((rider) => rider.availability === "busy");

  return (
    <section className="dispatcher-rider-card intelligence-card">
      <div className="dispatcher-rider-header">
        <div>
          <h2>Rider Intelligence</h2>

          <p>Current workload and availability</p>
        </div>

        <div className="rider-summary-badge">
          <FontAwesomeIcon icon={faTruck} />
          {riders.length} riders
        </div>
      </div>

      <div className="rider-columns">
        <div className="rider-group">
          <div className="rider-group-header available">
            <FontAwesomeIcon icon={faUserCheck} />
            Available Riders
            <span>{availableRiders.length}</span>
          </div>

          {availableRiders.map((rider) => (
            <RiderItem key={rider.id} rider={rider} />
          ))}

          {availableRiders.length === 0 && (
            <p className="rider-empty">No available riders</p>
          )}
        </div>

        <div className="rider-group">
          <div className="rider-group-header busy">
            <FontAwesomeIcon icon={faUserClock} />
            Busy Riders
            <span>{busyRiders.length}</span>
          </div>

          {busyRiders.map((rider) => (
            <RiderItem key={rider.id} rider={rider} />
          ))}

          {busyRiders.length === 0 && (
            <p className="rider-empty">No busy riders</p>
          )}
        </div>
      </div>
    </section>
  );
}

function RiderItem({ rider }: { rider: Rider }) {
  const activeDeliveries = Number(
    (
      rider as Rider & {
        active_deliveries?: number;
      }
    ).active_deliveries ?? 0,
  );

  const capacity = Math.min((activeDeliveries / 3) * 100, 100);

  return (
    <div className="rider-item">
      <div className="rider-info">
        <strong>{rider.name}</strong>

        <span>{activeDeliveries}/ 3 deliveries</span>
      </div>

      <div className="rider-progress">
        <div className="rider-progress-track">
          <div
            className="rider-progress-value"
            style={{
              width: `${capacity}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
