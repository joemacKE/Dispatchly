import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTruck,
  faBox,
  faRoute,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

type StatusFilter = "" | "assigned" | "in_transit" | "delivered";

type Props = {
  stats: {
    assigned: number;
    in_transit: number;
    delivered: number;
    active: number;
  };

  selected: string;

  onSelect: (status: StatusFilter) => void;
};

export default function RiderStatsCards({ stats, selected, onSelect }: Props) {
  const cards: {
    key: StatusFilter;
    title: string;
    value: number;
    icon: typeof faTruck;
    color: string;
  }[] = [
    {
      key: "",
      title: "Active Jobs",
      value: stats.active,
      icon: faTruck,
      color: "green",
    },

    {
      key: "assigned",
      title: "Assigned",
      value: stats.assigned,
      icon: faBox,
      color: "blue",
    },

    {
      key: "in_transit",
      title: "In Transit",
      value: stats.in_transit,
      icon: faRoute,
      color: "orange",
    },

    {
      key: "delivered",
      title: "Delivered",
      value: stats.delivered,
      icon: faCircleCheck,
      color: "purple",
    },
  ];

  return (
    <section className="rider-stats-grid">
      {cards.map((card) => (
        <button
          key={card.title}
          type="button"
          className={
            selected === card.key ? "rider-stat-card active" : "rider-stat-card"
          }
          onClick={() => onSelect(card.key)}
        >
          <div className={`rider-stat-icon ${card.color}`}>
            <FontAwesomeIcon icon={card.icon} />
          </div>

          <div className="rider-stat-info">
            <span>{card.title}</span>

            <small>View deliveries →</small>
          </div>

          <strong className="rider-stat-number">{card.value}</strong>
        </button>
      ))}
    </section>
  );
}
