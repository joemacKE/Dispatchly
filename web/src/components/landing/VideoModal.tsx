import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faXmark } from "@fortawesome/free-solid-svg-icons";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function VideoModal({ open, onClose }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
fixed
inset-0
z-[100]
bg-black/80
backdrop-blur-sm
flex
items-center
justify-center
px-6
"
      onClick={onClose}
    >
      <div
        className="
relative
w-full
max-w-5xl
bg-black
rounded-3xl
overflow-hidden
shadow-2xl
"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="
absolute
right-5
top-5
z-10
w-10
h-10
rounded-full
bg-white/20
text-white
flex
items-center
justify-center
hover:bg-white/30
"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div
          className="
aspect-video
flex
items-center
justify-center
bg-slate-900
text-white
"
        >
          <div
            className="
text-center
"
          >
            <h3
              className="
text-3xl
font-black
"
            >
              Dispatchly Platform Demo
            </h3>

            <p
              className="
mt-3
text-white/70
"
            >
              Product showcase video coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
