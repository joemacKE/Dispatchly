import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type Props = {
  category: string;

  title: string;

  description: string;

  image: string;

  icon: IconDefinition;

  items: string[];
};

export default function FeatureCard({
  category,
  title,
  description,
  image,
  icon,
  items,
}: Props) {
  return (
    <div
      className="
group
bg-white
rounded-[32px]
overflow-hidden
border
border-slate-200
shadow-sm
hover:shadow-2xl
transition-all
duration-500
"
    >
      {/* Illustration Container */}

      <div
        className="
relative
h-72
overflow-hidden
bg-gradient-to-br
from-emerald-50
via-white
to-slate-100
"
      >
        <img
          src={image}
          alt={title}
          className="
w-full
h-full
object-contain
transition-transform
duration-700
group-hover:scale-105
"
        />
      </div>

      {/* Content */}

      <div
        className="
p-8
"
      >
        {/* Category + Icon */}

        <div
          className="
flex
items-center
gap-4
"
        >
          <div
            className="
w-12
h-12
rounded-2xl
bg-emerald-100
text-emerald-700
flex
items-center
justify-center
text-lg
"
          >
            <FontAwesomeIcon icon={icon} />
          </div>

          <p
            className="
text-xs
uppercase
tracking-[0.2em]
font-bold
text-slate-500
"
          >
            {category}
          </p>
        </div>

        {/* Title */}

        <h3
          className="
mt-6
text-3xl
font-black
leading-tight
text-slate-900
"
        >
          {title}
        </h3>

        {/* Description */}

        <p
          className="
mt-4
text-slate-600
leading-relaxed
"
        >
          {description}
        </p>

        {/* Benefits */}

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
w-6
h-6
rounded-full
bg-emerald-500
text-white
flex
items-center
justify-center
text-xs
font-bold
"
              >
                ✓
              </span>

              <span
                className="
text-sm
font-medium
"
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
