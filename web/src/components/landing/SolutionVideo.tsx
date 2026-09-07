import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faPlay } from "@fortawesome/free-solid-svg-icons";

type Props = {
  onPlay: () => void;
};

export default function SolutionVideo({ onPlay }: Props) {
  return (
    <div
      className="
relative
rounded-[32px]
overflow-hidden
bg-slate-900
aspect-video
shadow-2xl
cursor-pointer
group
"
      onClick={onPlay}
    >
      <img
        src="/assets/landing/dispatcher-control-room.png"
        alt="Dispatchly operations"
        className="
absolute
inset-0
w-full
h-full
object-cover
opacity-80
group-hover:scale-105
transition
duration-700
"
      />

      <div
        className="
absolute
inset-0
bg-black/50
"
      />

      <div
        className="
relative
z-10
h-full
flex
items-center
justify-center
"
      >
        <div
          className="
w-24
h-24
rounded-full
bg-emerald-500
text-white
flex
items-center
justify-center
text-3xl
shadow-xl
group-hover:scale-110
transition
"
        >
          <FontAwesomeIcon icon={faPlay} />
        </div>
      </div>

      <div
        className="
absolute
bottom-8
left-8
text-white
"
      >
        <h3
          className="
text-3xl
font-black
"
        >
          See How Dispatchly Works
        </h3>

        <p
          className="
mt-2
text-white/80
"
        >
          Explore how retailers, dispatchers and riders work together.
        </p>
      </div>
    </div>
  );
}
