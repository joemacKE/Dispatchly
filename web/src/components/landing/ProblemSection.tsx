import ProblemStats from "./ProblemStats";
import ProblemTimeline from "./ProblemTimeline";
import ProblemVisual from "./ProblemVisual";

export default function ProblemSection() {
  return (
    <section
      id="problem"
      className="
relative
bg-slate-50
py-28
overflow-hidden
"
    >
      <div
        className="
max-w-7xl
mx-auto
px-6
"
      >
        {/* Header */}

        <div
          className="
max-w-3xl
"
        >
          <p
            className="
uppercase
tracking-[0.35em]
text-sm
font-bold
text-emerald-600
"
          >
            The Challenge
          </p>

          <h2
            className="
mt-6
text-4xl
md:text-6xl
font-black
leading-tight
text-slate-900
"
          >
            Every business wants faster delivery.
            <br />
            <span
              className="
text-emerald-600
"
            >
              But operations are still disconnected.
            </span>
          </h2>

          <p
            className="
mt-6
text-lg
text-slate-600
max-w-2xl
"
          >
            Orders move fast. Coordination does not. Businesses still rely on
            calls, messages and spreadsheets to manage deliveries.
          </p>
        </div>

        {/* Main Visual */}

        <div
          className="
mt-20
grid
lg:grid-cols-2
gap-16
items-center
"
        >
          <ProblemStats />

          <ProblemVisual />
        </div>

        {/* Timeline */}

        <div
          className="
mt-24
"
        >
          <ProblemTimeline />
        </div>

        {/* Transition */}

        <div
          className="
mt-20
rounded-3xl
bg-white
border
border-slate-200
p-10
md:p-14
flex
flex-col
md:flex-row
items-center
justify-between
gap-8
"
        >
          <div>
            <h3
              className="
text-3xl
font-black
text-slate-900
"
            >
              It doesn't have to be this way.
            </h3>

            <p
              className="
mt-3
text-slate-600
"
            >
              Dispatchly connects retailers, dispatchers and riders in one
              intelligent platform.
            </p>
          </div>

          <button
            className="
bg-emerald-500
text-white
px-8
py-4
rounded-xl
font-bold
"
          >
            See The Solution
          </button>
        </div>
      </div>
    </section>
  );
}
