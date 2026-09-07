import {
  faCartShopping,
  faPhone,
  faClock,
  faFaceFrown,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const steps = [
  {
    icon: faCartShopping,
    title: "Order Received",
  },

  {
    icon: faPhone,
    title: "Manual Coordination",
  },

  {
    icon: faClock,
    title: "Delivery Delays",
  },

  {
    icon: faFaceFrown,
    title: "Customer Frustration",
  },

  {
    icon: faChartLine,
    title: "Lost Business",
  },
];

export default function ProblemTimeline() {
  return (
    <div>
      <h3
        className="
text-3xl
font-black
text-slate-900
mb-10
"
      >
        A broken delivery workflow
      </h3>

      <div
        className="
grid
md:grid-cols-5
gap-6
"
      >
        {steps.map((step) => (
          <div
            key={step.title}
            className="
text-center
"
          >
            <div
              className="
mx-auto
w-16
h-16
rounded-full
bg-red-100
text-red-500
flex
items-center
justify-center
text-xl
"
            >
              <FontAwesomeIcon icon={step.icon} />
            </div>

            <p
              className="
mt-4
font-bold
text-slate-800
"
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
