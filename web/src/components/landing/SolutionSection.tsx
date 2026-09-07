import { useState } from "react";

import SolutionVideo from "./SolutionVideo";

import VideoModal from "./VideoModal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SolutionFlow from "./SolutionFlow";
import {
  faNetworkWired,
  faLocationDot,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export default function SolutionSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  const pillars = [
    {
      icon: faNetworkWired,
      title: "Connected Operations",
      text: "Bring retailers, dispatchers and riders into one workflow.",
    },

    {
      icon: faLocationDot,
      title: "Real-Time Visibility",
      text: "Track delivery progress from order to completion.",
    },

    {
      icon: faChartLine,
      title: "Better Decisions",
      text: "Use delivery insights to improve operations.",
    },
  ];

  return (
    <section
      className="
bg-[#071A17]
py-28
text-white
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
text-emerald-400
font-bold
text-sm
"
          >
            The Solution
          </p>

          <h2
            className="
mt-6
text-4xl
md:text-6xl
font-black
"
          >
            One platform.
            <br />
            Every delivery connected.
          </h2>

          <p
            className="
mt-6
text-white/70
text-lg
"
          >
            Dispatchly gives businesses complete visibility from order creation
            to final delivery.
          </p>
        </div>

        <div className="mt-16">
          <SolutionVideo onPlay={() => setVideoOpen(true)} />
          <SolutionFlow />
        </div>

        <div
          className="
mt-16
grid
md:grid-cols-3
gap-8
"
        >
          {pillars.map((item) => (
            <div
              key={item.title}
              className="
bg-white/10
backdrop-blur
rounded-3xl
p-8
border
border-white/10
"
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="
text-emerald-400
text-3xl
"
              />

              <h3
                className="
mt-6
text-xl
font-bold
"
              >
                {item.title}
              </h3>

              <p
                className="
mt-3
text-white/70
"
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
