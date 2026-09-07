import FeatureShowcase from "./FeatureShowcase";

import {
  faGaugeHigh,
  faMotorcycle,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export default function FeaturesSection() {
  return (
    <section
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
uppercase
tracking-[0.3em]
text-sm
font-bold
text-emerald-600
"
          >
            The Platform
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
            Dispatchly provides the tools businesses need to coordinate, monitor
            and improve delivery operations.
          </p>
        </div>

        <div
          className="
mt-20
space-y-28
"
        >
          <FeatureShowcase
            title="Stay in control."
            description="Dispatchers get complete visibility into delivery operations, allowing faster decisions and better coordination."
            icon={faGaugeHigh}
            image="/assets/landing/dispatcher-dashboard.png"
            items={[
              "Delivery assignment",
              "Rider management",
              "Real-time status tracking",
              "Operational visibility",
            ]}
          />

          <FeatureShowcase
            reverse
            title="Every rider knows what comes next."
            description="Riders receive clear workflows that simplify pickup, delivery and completion."
            icon={faMotorcycle}
            image="/assets/landing/rider-dashboard.png"
            items={[
              "Assigned deliveries",
              "QR verification",
              "Delivery updates",
              "Completion tracking",
            ]}
          />

          <FeatureShowcase
            title="Grow with visibility."
            description="Understand performance and improve operations through delivery insights."
            icon={faChartLine}
            image="/assets/landing/business-dashboard.png"
            items={[
              "Delivery insights",
              "Performance monitoring",
              "Operational improvement",
            ]}
          />
        </div>
      </div>
    </section>
  );
}
