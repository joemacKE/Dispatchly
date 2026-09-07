import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type Props = {
  title: string;

  message: string;

  description: string;

  image: string;

  icon: IconDefinition;

  benefits: string[];
};

export default function SegmentCard({
  title,
  message,
  description,
  image,
  icon,
  benefits,
}: Props) {
  return (
    <div
      className="
      group
      bg-white
      rounded-[32px]
      border
      border-slate-200
      overflow-hidden
      shadow-sm
      hover:shadow-2xl
      transition-all
      duration-500
      "
    >
      {/* Illustration */}

      <div
        className="
        h-72
        bg-gradient-to-br
        from-emerald-50
        via-white
        to-slate-100
        flex
        items-center
        justify-center
        overflow-hidden
        "
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="
          w-full
          h-full
          object-contain
          group-hover:scale-105
          transition-transform
          duration-700
          "
        />
      </div>

      {/* Content */}

      <div
        className="
        p-8
        "
      >
        {/* Icon */}

        <div
          className="
          w-12
          h-12
          rounded-2xl
          bg-emerald-100
          text-emerald-600
          flex
          items-center
          justify-center
          "
        >
          <FontAwesomeIcon icon={icon} />
        </div>

        {/* Title */}

        <h3
          className="
          mt-6
          text-3xl
          font-black
          text-slate-900
          "
        >
          {title}
        </h3>

        {/* Value statement */}

        <h4
          className="
          mt-3
          text-lg
          font-bold
          text-emerald-600
          "
        >
          {message}
        </h4>

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
          mt-6
          space-y-3
          "
        >
          {benefits.map((item) => (
            <li
              key={item}
              className="
              flex
              items-center
              gap-3
              text-sm
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
