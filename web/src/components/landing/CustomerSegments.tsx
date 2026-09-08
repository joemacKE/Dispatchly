import SegmentCard from "./SegmentCard";

import {
  faStore,
  faUsersGear,
  faMotorcycle,
} from "@fortawesome/free-solid-svg-icons";

export default function CustomerSegments() {
  const segments = [
    {
      title: "Retailers",

      message: "Grow your business with reliable deliveries.",

      description:
        "Give customers a better delivery experience while keeping every order organized and visible.",

      image: "/assets/segments/retailer.png",

      icon: faStore,

      benefits: [
        "Manage delivery requests",
        "Improve customer experience",
        "Reduce operational delays",
      ],
    },

    {
      title: "Dispatchers",

      message: "Stay in control of every delivery.",

      description:
        "Coordinate riders, monitor progress and manage delivery operations from one place.",

      image: "/assets/segments/dispatcher-illustration.png",

      icon: faUsersGear,

      benefits: [
        "Assign riders efficiently",
        "Track delivery progress",
        "Improve coordination",
      ],
    },

    {
      title: "Riders",

      message: "Deliver smarter and earn more.",

      description:
        "Receive clear workflows and complete deliveries with confidence.",

      image: "/assets/segments/rider-illustration.png",

      icon: faMotorcycle,

      benefits: [
        "View assigned deliveries",
        "Secure pickup verification",
        "Complete jobs faster",
      ],
    },
  ];

  return (
    <section
      id="customers"
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
uppercase
tracking-[0.3em]
text-sm
font-bold
text-emerald-600
"
          >
            WHO WE SERVE
          </p>

          <h2
            className="
mt-5
text-5xl
font-black
text-slate-900
"
          >
            Built for everyone moving deliveries forward.
          </h2>

          <p
            className="
mt-5
text-lg
text-slate-600
"
          >
            Dispatchly connects businesses, operations teams and riders through
            one platform.
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
          {segments.map((segment) => (
            <SegmentCard key={segment.title} {...segment} />
          ))}
        </div>
      </div>
    </section>
  );
}
