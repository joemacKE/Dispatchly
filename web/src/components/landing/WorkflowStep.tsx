import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type Props = {
  number: string;
  title: string;
  description: string;
  icon: IconDefinition;
};

export default function WorkflowStep({
  number,
  title,
  description,
  icon,
}: Props) {
  return (
    <div
      className="
relative
flex
flex-col
items-center
text-center
"
    >
      <div
        className="
absolute
top-8
hidden
md:block
left-1/2
w-full
h-px
bg-slate-200
"
      ></div>

      <div
        className="
relative
z-10
w-16
h-16
rounded-full
bg-emerald-500
text-white
flex
items-center
justify-center
text-xl
shadow-lg
"
      >
        <FontAwesomeIcon icon={icon} />
      </div>

      <span
        className="
mt-5
text-sm
font-bold
text-emerald-600
"
      >
        {number}
      </span>

      <h3
        className="
mt-3
text-xl
font-black
text-slate-900
"
      >
        {title}
      </h3>

      <p
        className="
mt-3
text-slate-600
max-w-xs
"
      >
        {description}
      </p>
    </div>
  );
}
