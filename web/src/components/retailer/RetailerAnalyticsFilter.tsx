type Props = {
  period: "today" | "7days" | "30days" | "all";

  onChange: (period: "today" | "7days" | "30days" | "all") => void;
};

export default function RetailerAnalyticsFilter({ period, onChange }: Props) {
  const options = [
    {
      label: "Today",
      value: "today",
    },

    {
      label: "7 Days",
      value: "7days",
    },

    {
      label: "30 Days",
      value: "30days",
    },

    {
      label: "All Time",
      value: "all",
    },
  ];

  return (
    <div className="analytics-filter">
      {options.map((option) => (
        <button
          key={option.value}
          className={period === option.value ? "active" : ""}
          onClick={() =>
            onChange(option.value as "today" | "7days" | "30days" | "all")
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
