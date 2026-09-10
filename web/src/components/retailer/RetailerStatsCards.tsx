import {
  faBox,
  faClock,
  faTruckFast,
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

export default function RetailerStatsCards({
  stats,
  selected,
  onSelect,
}: Props) {
  const totalOrders =
    stats.pending + stats.assigned + stats.in_transit + stats.delivered;

  const cards = [
    {
      label: "Total Orders",
      description: "All delivery requests",
      value: totalOrders,
      status: "",
      icon: faBox,
      iconClass: "green",
      trend: "All orders",
    },

    {
      label: "Pending Pickup",
      description: "Waiting for assignment",
      value: stats.pending,
      status: "pending",
      icon: faClock,
      iconClass: "orange",
      trend: "Awaiting dispatch",
    },

    {
      label: "In Transit",
      description: "Currently delivering",
      value: stats.in_transit,
      status: "in_transit",
      icon: faTruckFast,
      iconClass: "blue",
      trend: "Active deliveries",
    },

    {
      label: "Completed",
      description: "Successfully delivered",
      value: stats.delivered,
      status: "delivered",
      icon: faCircleCheck,
      iconClass: "purple",
      trend: "Completed jobs",
    },
  ];

  return (
    <div className="retailer-stats-grid">
      {cards.map((card) => {
        const active =
          card.status === "" ? selected === "" : selected === card.status;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelect(card.status)}
            className={
              active ? "retailer-stat-card active" : "retailer-stat-card"
            }
          >
            <div className={`retailer-stat-icon ${card.iconClass}`}>
              <FontAwesomeIcon icon={card.icon} />
            </div>

            <div className="retailer-stat-content">
              <span className="retailer-stat-label">{card.label}</span>

              <small>{card.description}</small>

              <span className="retailer-stat-link">{card.trend} →</span>
            </div>

            <strong className="retailer-stat-number">{card.value}</strong>
          </button>
        );
      })}
    </div>
  );
}
