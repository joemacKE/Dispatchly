import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faClock,
  faUserCheck,
  faTriangleExclamation,
  faRoute,
} from "@fortawesome/free-solid-svg-icons";

import type { Delivery, Rider } from "../../types";

type InsightType =
  | "unassigned"
  | "delayed"
  | "available_riders"
  | "busy_riders";

type Props = {
  orders: Delivery[];

  riders: Rider[];

  activeInsight: InsightType | null;

  setActiveInsight: (value: InsightType) => void;
};

export default function DispatcherIntelligenceCards({
  orders,
  riders,
  activeInsight,
  setActiveInsight,
}: Props) {
  const now = new Date().getTime();

  /*
   * Deliveries waiting for assignment
   */

  const unassignedDeliveries = orders.filter(
    (order) => order.status === "pending",
  ).length;

  /*
   * Deliveries older than 30 minutes
   */

  const delayedDeliveries = orders.filter((order) => {
    if (!order.created_at) {
      return false;
    }

    const created = new Date(order.created_at).getTime();

    const ageMinutes = (now - created) / 60000;

    return ageMinutes >= 30 && order.status !== "delivered";
  }).length;

  /*
   * Riders currently available
   */

  const availableRiders = riders.filter(
    (rider) => rider.availability === "available",
  ).length;

  /*
   * Riders near capacity
   */

  const busyRiders = riders.filter(
    (rider) => rider.availability === "busy",
  ).length;

  const cards: {
    key: InsightType;
    title: string;
    value: number;
    description: string;
    icon: typeof faClock;
    className: string;
  }[] = [
    {
      key: "unassigned",

      title: "Unassigned Deliveries",

      value: unassignedDeliveries,

      description: "Need rider allocation",

      icon: faTriangleExclamation,

      className: "text-red-600",
    },

    {
      key: "delayed",

      title: "Delayed Deliveries",

      value: delayedDeliveries,

      description: "Waiting over 30 minutes",

      icon: faClock,

      className: "text-orange-500",
    },

    {
      key: "available_riders",

      title: "Available Riders",

      value: availableRiders,

      description: "Ready for assignment",

      icon: faUserCheck,

      className: "text-emerald-500",
    },

    {
      key: "busy_riders",

      title: "Busy Riders",

      value: busyRiders,

      description: "Near capacity",

      icon: faRoute,

      className: "text-blue-500",
    },
  ];

  return (
    <section className="dispatcher-intelligence-grid">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          className={`
            dispatcher-kpi-card
            ${activeInsight === card.key ? "active" : ""}
          `}
          onClick={() => setActiveInsight(card.key)}
        >
          <div
            className={`
              dispatcher-kpi-icon
              ${card.className}
            `}
          >
            <FontAwesomeIcon icon={card.icon} />
          </div>

          <div>
            <p className="dispatcher-kpi-title">{card.title}</p>

            <h3 className="dispatcher-kpi-value">{card.value}</h3>

            <span className="dispatcher-kpi-description">
              {card.description}
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}
