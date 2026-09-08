import FeatureCard from "./FeatureCard";

import {
  faGaugeHigh,
  faMotorcycle,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export default function FeaturesSection() {
  const features = [
    {
      category: "Dispatcher Operations",

      title: "Stay in control.",

      description:
        "Manage delivery requests, assign riders and monitor operations from one dashboard.",

      image: "/assets/dispatcher-illustration.png",

      icon: faGaugeHigh,

      items: [
        "Delivery assignment",

        "Rider management",

        "Real-time status tracking",

        "Operational visibility",
      ],
    },

    {
      category: "Rider Workflow",

      title: "Every rider knows what comes next.",

      description:
        "Give riders clear workflows to complete deliveries faster and more reliably.",

      image: "/assets/rider-illustration.png",

      icon: faMotorcycle,

      items: [
        "Assigned deliveries",

        "QR verification",

        "Delivery updates",

        "Completion tracking",
      ],
    },

    {
      category: "Business Intelligence",

      title: "Grow with visibility.",

      description:
        "Understand delivery performance and make better operational decisions.",

      image: "/assets/business-illustration.png",

      icon: faChartLine,

      items: [
        "Delivery insights",

        "Performance monitoring",

        "Customer experience improvement",

        "Business growth",
      ],
    },
  ];

  return (
    <section
      id="features"
      className="
py-28
bg-slate-50
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
text-center
max-w-3xl
mx-auto
"
        >
          <p
            className="
text-sm
uppercase
tracking-[0.3em]
font-bold
text-emerald-600
"
          >
            THE PLATFORM
          </p>

          <h2
            className="
mt-6
text-5xl
font-black
text-slate-900
"
          >
            Everything your delivery operation needs.
          </h2>

          <p
            className="
mt-5
text-lg
text-slate-600
"
          >
            Dispatchly gives businesses the tools to manage, coordinate and
            optimize every delivery from one place.
          </p>
        </div>

        <div
          className="
mt-16
grid
lg:grid-cols-3
gap-8
"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
