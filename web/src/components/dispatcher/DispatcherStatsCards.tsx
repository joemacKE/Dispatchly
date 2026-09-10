import {
  faClock,
  faUserCheck,
  faRoute,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  stats: {
    pending: number;
    assigned: number;
    in_transit: number;
    delivered: number;
  };

  selected: string;

  onSelect: (status: string) => void;
};

export default function DispatcherStatsCards({
  stats,
  selected,
  onSelect,
}: Props) {
  const cards = [
    {
      label: "Pending Orders",

      description: "Awaiting assignment",

      value: stats.pending,

      status: "pending",

      icon: faClock,

      color: "green",
    },

    {
      label: "Assigned",

      description: "Riders dispatched",

      value: stats.assigned,

      status: "assigned",

      icon: faUserCheck,

      color: "blue",
    },

    {
      label: "In Transit",

      description: "Active deliveries",

      value: stats.in_transit,

      status: "in_transit",

      icon: faRoute,

      color: "orange",
    },

    {
      label: "Delivered",

      description: "Completed jobs",

      value: stats.delivered,

      status: "delivered",

      icon: faCircleCheck,

      color: "purple",
    },
  ];

  return (
    <div className="rider-stats-grid">
      {cards.map((card) => (
        <button
          key={card.status}
          onClick={() => onSelect(card.status)}
          className={
            selected === card.status
              ? "rider-stat-card active"
              : "rider-stat-card"
          }
        >
          <div className={`rider-stat-icon ${card.color}`}>
            <FontAwesomeIcon icon={card.icon} />
          </div>

          <div className="rider-card-content">
            <span>{card.label}</span>

            <small>{card.description}</small>
          </div>

          <strong className="rider-stat-number">{card.value}</strong>
        </button>
      ))}
    </div>
  );
}
