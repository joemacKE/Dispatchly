import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type Props = {
  title: string;

  description: string;

  icon: IconDefinition;

  image: string;

  items: string[];

  reverse?: boolean;
};

export default function FeatureShowcase({
  title,
  description,
  icon,
  image,
  items,
  reverse = false,
}: Props) {
  return (
    <div
      className={`
grid
lg:grid-cols-2
gap-14
items-center

${reverse ? "lg:flex-row-reverse" : ""}

`}
    >
      <div
        className="
rounded-3xl
overflow-hidden
shadow-2xl
border
border-slate-200
"
      >
        <img
          src={image}
          alt={title}
          className="
w-full
h-[420px]
object-cover
"
        />
      </div>

      <div>
        <div
          className="
w-14
h-14
rounded-2xl
bg-emerald-100
text-emerald-600
flex
items-center
justify-center
text-xl
"
        >
          <FontAwesomeIcon icon={icon} />
        </div>

        <h3
          className="
mt-6
text-4xl
font-black
text-slate-900
"
        >
          {title}
        </h3>

        <p
          className="
mt-5
text-lg
text-slate-600
leading-relaxed
"
        >
          {description}
        </p>

        <ul
          className="
mt-8
space-y-4
"
        >
          {items.map((item) => (
            <li
              key={item}
              className="
flex
items-center
gap-3
text-slate-700
"
            >
              <span
                className="
w-2
h-2
rounded-full
bg-emerald-500
"
              />

              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
