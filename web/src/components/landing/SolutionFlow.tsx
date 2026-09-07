import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faStore,
  faTruck,
  faNetworkWired,
} from "@fortawesome/free-solid-svg-icons";

export default function SolutionFlow() {
  return (
    <div
      className="
mt-20
relative
grid
md:grid-cols-3
gap-8
items-center
"
    >
      <div
        className="
bg-white/10
border
border-white/10
rounded-3xl
p-8
text-center
"
      >
        <FontAwesomeIcon
          icon={faStore}
          className="
text-emerald-400
text-4xl
"
        />

        <h3
          className="
mt-5
text-xl
font-bold
"
        >
          Retailers
        </h3>

        <p
          className="
mt-3
text-white/70
"
        >
          Create orders and manage customers.
        </p>
      </div>

      <div
        className="
bg-emerald-500
rounded-3xl
p-10
text-center
shadow-2xl
"
      >
        <FontAwesomeIcon
          icon={faNetworkWired}
          className="
text-white
text-4xl
"
        />

        <h3
          className="
mt-5
text-xl
font-bold
"
        >
          Dispatchly
        </h3>

        <p
          className="
mt-3
text-white/90
"
        >
          One intelligent delivery coordination platform.
        </p>
      </div>

      <div
        className="
bg-white/10
border
border-white/10
rounded-3xl
p-8
text-center
"
      >
        <FontAwesomeIcon
          icon={faTruck}
          className="
text-emerald-400
text-4xl
"
        />

        <h3
          className="
mt-5
text-xl
font-bold
"
        >
          Riders
        </h3>

        <p
          className="
mt-3
text-white/70
"
        >
          Receive tasks and complete deliveries efficiently.
        </p>
      </div>
    </div>
  );
}
