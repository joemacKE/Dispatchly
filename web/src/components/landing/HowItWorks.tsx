import {
  faStore,
  faUserTie,
  faQrcode,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import WorkflowStep from "./WorkflowStep";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Delivery",
      description:
        "Retailers create delivery requests with customer information.",
      icon: faStore,
    },

    {
      number: "02",
      title: "Assign Rider",
      description: "Dispatchers allocate deliveries and manage operations.",
      icon: faUserTie,
    },

    {
      number: "03",
      title: "Verify & Deliver",
      description:
        "Riders complete pickup and delivery using secure verification.",
      icon: faQrcode,
    },

    {
      number: "04",
      title: "Complete Delivery",
      description: "Customers receive orders with full delivery visibility.",
      icon: faCircleCheck,
    },
  ];

  return (
    <section
      className="
py-28
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
            The Workflow
          </p>

          <h2
            className="
mt-5
text-4xl
md:text-5xl
font-black
text-slate-900
"
          >
            From order creation to successful delivery.
          </h2>

          <p
            className="
mt-5
text-lg
text-slate-600
"
          >
            Dispatchly connects every step of the delivery process, giving
            businesses complete visibility and control.
          </p>
        </div>

        <div
          className="
mt-20
grid
md:grid-cols-4
gap-10
"
        >
          {steps.map((step) => (
            <WorkflowStep key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
