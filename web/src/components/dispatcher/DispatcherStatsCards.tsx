type Props = {
  stats: {
    pending: number;
    active: number;
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
      label: "Pending",
      value: stats.pending,
      status: "pending",
    },

    {
      label: "Active",
      value: stats.active,
      status: "active",
    },

    {
      label: "Delivered",
      value: stats.delivered,
      status: "delivered",
    },
  ];

  return (
    <div className="order-stat-grid">
      {cards.map((card) => (
        <button
          key={card.status}
          className={
            selected === card.status
              ? "order-stat-card selected"
              : "order-stat-card"
          }
          onClick={() => onSelect(card.status)}
        >
          <strong>{card.value}</strong>

          <span>{card.label}</span>
        </button>
      ))}
    </div>
  );
}
