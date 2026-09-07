import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faStore,
  faRoute,
  faMotorcycle,
} from "@fortawesome/free-solid-svg-icons";

export default function ProblemSection() {
  const problems = [
    {
      icon: faStore,
      title: "Retailers",
      headline: "Orders leave. Visibility disappears.",
      text: "Retailers struggle to track deliveries, manage customer expectations and maintain control after an order leaves the store.",
    },

    {
      icon: faRoute,
      title: "Dispatchers",
      headline: "Too much coordination. Not enough control.",
      text: "Managing riders through calls, messages and spreadsheets creates delays and operational blind spots.",
    },

    {
      icon: faMotorcycle,
      title: "Riders",
      headline: "Great riders need better tools.",
      text: "Without clear workflows and delivery information, riders lose time and efficiency.",
    },
  ];

  return (
    <section
      className="
py-24
bg-white
"
    >
      <div
        className="
max-w-7xl
mx-auto
px-6
"
      >
        <div
          className="
max-w-3xl
mb-16
"
        >
          <p
            className="
text-emerald-600
uppercase
tracking-[0.3em]
font-bold
text-sm
"
          >
            The Challenge
          </p>

          <h2
            className="
mt-5
text-4xl
md:text-5xl
font-black
text-slate-900
leading-tight
"
          >
            Delivery is growing.
            <br />
            Operations are falling behind.
          </h2>

          <p
            className="
mt-6
text-lg
text-slate-600
leading-relaxed
"
          >
            Modern businesses need more than delivery services. They need a
            connected platform that brings retailers, dispatchers and riders
            together in real time.
          </p>
        </div>

        <div
          className="
grid
md:grid-cols-3
gap-8
"
        >
          {problems.map((item) => (
            <div
              key={item.title}
              className="
rounded-3xl
border
border-slate-200
p-8
hover:shadow-xl
transition
"
            >
              <div
                className="
w-14
h-14
rounded-2xl
bg-emerald-100
flex
items-center
justify-center
text-emerald-600
text-xl
"
              >
                <FontAwesomeIcon icon={item.icon} />
              </div>

              <h3
                className="
mt-6
font-bold
text-xl
text-slate-900
"
              >
                {item.title}
              </h3>

              <h4
                className="
mt-4
font-bold
text-lg
text-slate-800
"
              >
                {item.headline}
              </h4>

              <p
                className="
mt-4
text-slate-600
leading-relaxed
"
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
