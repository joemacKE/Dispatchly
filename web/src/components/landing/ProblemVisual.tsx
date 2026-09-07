import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPhone,
  faTriangleExclamation,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

export default function ProblemVisual() {
  return (
    <div
      className="
relative
min-h-[650px]
"
    >
      {/* Background glow */}

      <div
        className="
absolute
top-20
right-20
w-72
h-72
bg-emerald-200
rounded-full
blur-3xl
opacity-30
"
      />

      {/* Retailer */}

      <div
        className="
absolute
top-0
left-0
w-72
rounded-3xl
overflow-hidden
shadow-2xl
border
border-white
"
      >
        <img
          src="/assets/retailer.png"
          alt="Retailer managing deliveries"
          className="
w-full
h-80
object-cover
"
        />

        <div
          className="
absolute
bottom-5
left-5
bg-white/90
backdrop-blur
rounded-xl
px-5
py-3
shadow
"
        >
          <p
            className="
font-bold
text-slate-900
"
          >
            Retailer
          </p>

          <p
            className="
text-sm
text-slate-500
"
          >
            Managing incoming orders
          </p>
        </div>
      </div>

      {/* Problem Badge */}

      <div
        className="
absolute
top-24
right-0
bg-red-50
text-red-600
rounded-full
px-5
py-3
flex
items-center
gap-3
shadow-lg
"
      >
        <FontAwesomeIcon icon={faPhone} />

        <span
          className="
font-semibold
text-sm
"
        >
          Manual coordination
        </span>
      </div>

      {/* Dispatcher */}

      <div
        className="
absolute
top-64
left-40
w-[360px]
bg-slate-950
rounded-3xl
p-6
shadow-2xl
z-10
"
      >
        <div
          className="
flex
justify-between
"
        >
          <h3
            className="
text-white
font-bold
"
          >
            Dispatcher Operations
          </h3>

          <span
            className="
text-red-400
text-sm
"
          >
            Disconnected
          </span>
        </div>

        <div
          className="
mt-6
space-y-3
"
        >
          <div
            className="
bg-white/10
rounded-xl
p-4
text-white
"
          >
            Order #1024
            <span
              className="
float-right
text-red-400
"
            >
              Delayed
            </span>
          </div>

          <div
            className="
bg-white/10
rounded-xl
p-4
text-white
"
          >
            Order #1025
            <span
              className="
float-right
text-yellow-400
"
            >
              Waiting
            </span>
          </div>

          <div
            className="
bg-white/10
rounded-xl
p-4
text-white
"
          >
            Order #1026
            <span
              className="
float-right
text-red-400
"
            >
              Missing
            </span>
          </div>
        </div>
      </div>

      {/* Rider */}

      <div
        className="
absolute
bottom-0
right-0
w-72
rounded-3xl
overflow-hidden
shadow-2xl
border
border-white
"
      >
        <img
          src="/assets/rider.png"
          alt="Dispatchly rider"
          className="
w-full
h-96
object-cover
"
        />

        <div
          className="
absolute
bottom-5
left-5
bg-white/90
backdrop-blur
rounded-xl
px-5
py-3
"
        >
          <p
            className="
font-bold
text-slate-900
"
          >
            Rider
          </p>

          <p
            className="
text-sm
text-slate-500
"
          >
            Waiting for updates
          </p>
        </div>
      </div>

      {/* Alerts */}

      <div
        className="
absolute
bottom-44
left-10
bg-white
rounded-xl
shadow-xl
px-5
py-4
flex
items-center
gap-3
"
      >
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="
text-orange-500
"
        />

        <span
          className="
font-semibold
text-sm
"
        >
          No visibility
        </span>
      </div>

      <div
        className="
absolute
bottom-20
right-72
bg-white
rounded-xl
shadow-xl
px-5
py-4
flex
items-center
gap-3
"
      >
        <FontAwesomeIcon
          icon={faClock}
          className="
text-red-500
"
        />

        <span
          className="
font-semibold
text-sm
"
        >
          Delivery delays
        </span>
      </div>
    </div>
  );
}
