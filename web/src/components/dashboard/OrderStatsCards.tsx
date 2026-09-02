type Stats = {
  total: number;
  pending: number;
  active: number;
  picked_up: number;
  delivered: number;
  failed: number;
};

type Props = {
  stats: Stats;

  selected: string;

  onSelect: (status: string) => void;
};

export default function OrderStatsCards({ stats, selected, onSelect }: Props) {
  const cards = [
    {
      label: "Total Orders",
      value: stats.total,
      status: "",
      color: "blue",
      icon: "📦",
    },

    {
      label: "Pending",
      value: stats.pending,
      status: "pending",
      color: "orange",
      icon: "⏳",
    },

    {
      label: "Active",
      value: stats.active,
      status: "active",
      color: "purple",
      icon: "🚚",
    },

    {
      label: "Picked Up",
      value: stats.picked_up,
      status: "picked_up",
      color: "green",
      icon: "✓",
    },

    {
      label: "Delivered",
      value: stats.delivered,
      status: "delivered",
      color: "teal",
      icon: "🏠",
    },

    {
      label: "Failed",
      value: stats.failed,
      status: "failed",
      color: "red",
      icon: "!",
    },
  ];

  return (
    <section className="order-stat-grid">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          className={
            selected === card.status
              ? `order-stat-card selected ${card.color}`
              : `order-stat-card ${card.color}`
          }
          onClick={() => onSelect(card.status)}
        >
          <div className="order-stat-icon">{card.icon}</div>

          <div className="order-stat-content">
            <strong>{card.value}</strong>

            <span>{card.label}</span>
          </div>
        </button>
      ))}
    </section>
  );
}
