import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed
        top-0
        left-0
        right-0
        z-50
        transition-all
        duration-300

        ${
          scrolled
            ? `
          bg-white/90
          backdrop-blur-xl
          shadow-sm
          `
            : `
          bg-transparent
          `
        }

      `}
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          py-5
          flex
          items-center
          justify-between
        "
      >
        {/* Logo */}

        <div
          className="
          flex
          items-center
          gap-3
          "
        >
          <div
            className={`
              w-10
              h-10
              rounded-xl
              flex
              items-center
              justify-center
              font-black
              transition

              ${
                scrolled
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-500 text-white"
              }

            `}
          >
            D
          </div>

          <span
            className={`
              text-2xl
              font-bold
              transition

              ${scrolled ? "text-slate-900" : "text-white"}

            `}
          >
            Dispatchly
          </span>
        </div>

        {/* Links */}

        <div
          className={`
            hidden
            md:flex
            gap-10
            font-medium
            transition

            ${scrolled ? "text-slate-700" : "text-white"}

          `}
        >
          <a>Solutions</a>

          <a>Features</a>

          <a>How it Works</a>

          <a>Resources</a>
        </div>

        {/* Actions */}

        <div
          className="
          flex
          items-center
          gap-5
          "
        >
          <button
            className={`
              hidden
              md:block
              font-semibold
              transition

              ${scrolled ? "text-slate-700" : "text-white"}

            `}
          >
            Login
          </button>

          <button
            className="
              bg-emerald-500
              hover:bg-emerald-600
              text-white
              px-6
              py-3
              rounded-full
              font-semibold
              flex
              items-center
              gap-3
            "
          >
            Request Demo
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </nav>
  );
}
