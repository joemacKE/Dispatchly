const stats = [
  {
    number: "3",
    title: "Connected Networks",
    text: "Retailers, dispatchers and riders",
  },

  {
    number: "1",
    title: "Unified Platform",
    text: "One delivery workflow",
  },

  {
    number: "24/7",
    title: "Visibility",
    text: "Track every delivery",
  },
];

export default function ProblemStats() {
  return (
    <div
      className="
grid
grid-cols-3
gap-6
"
    >
      {stats.map((item) => (
        <div
          key={item.title}
          className="
bg-white
rounded-3xl
p-6
shadow-sm
border
border-slate-200
"
        >
          <h3
            className="
text-4xl
font-black
text-emerald-600
"
          >
            {item.number}
          </h3>

          <p
            className="
mt-3
font-bold
text-slate-900
"
          >
            {item.title}
          </p>

          <p
            className="
mt-2
text-sm
text-slate-500
"
          >
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}
