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
    },

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
      label: "Picked Up",
      value: stats.picked_up,
      status: "picked_up",
    },

    {
      label: "Delivered",
      value: stats.delivered,
      status: "delivered",
    },

    {
      label: "Failed",
      value: stats.failed,
      status: "failed",
    },
  ];

  return (
    <section className="stats">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          className={
            selected === card.status ? "stat-card selected" : "stat-card"
          }
          onClick={() => onSelect(card.status)}
        >
          <span>{card.label}</span>

          <strong>{card.value}</strong>
        </button>
      ))}
    </section>
  );
}
