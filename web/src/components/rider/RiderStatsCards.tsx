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

  onSelect: (status: "" | "assigned" | "in_transit" | "delivered") => void;
};

export default function RiderStatsCards({ stats, selected, onSelect }: Props) {
  const cards: {
    key: StatusFilter;
    title: string;
    value: number;
    icon: any;
  }[] = [
    {
      key: "",
      title: "Active Jobs",
      value: stats.active,
      icon: faTruck,
    },

    {
      key: "assigned",
      title: "Assigned",
      value: stats.assigned,
      icon: faBox,
    },

    {
      key: "in_transit",
      title: "In Transit",
      value: stats.in_transit,
      icon: faRoute,
    },

    {
      key: "delivered",
      title: "Delivered",
      value: stats.delivered,
      icon: faCircleCheck,
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
          <div className="rider-card-icon">
            <FontAwesomeIcon icon={card.icon} />
          </div>

          <div className="rider-card-content">
            <span>{card.title}</span>

            <strong>{card.value}</strong>

            <small>View deliveries</small>
          </div>
        </button>
      ))}
    </section>
  );
}
