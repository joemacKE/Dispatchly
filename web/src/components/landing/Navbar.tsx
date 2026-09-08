import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  {
    name: "Home",
    href: "#home",
  },

  {
    name: "Problem",
    href: "#problem",
  },

  {
    name: "Solution",
    href: "#solution",
  },

  {
    name: "How It Works",
    href: "#workflow",
  },

  {
    name: "Features",
    href: "#features",
  },

  {
    name: "Contact",
    href: "#contact",
  },
];

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

        <a
          href="#home"
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-emerald-500
              text-white
              flex
              items-center
              justify-center
              font-black
            "
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
        </a>

        {/* Navigation */}

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
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="
                  hover:text-emerald-500
                  transition
                "
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Actions */}

        <div
          className="
            flex
            items-center
            gap-5
          "
        >
          {/* Login */}

          <button
            className={`
              hidden
              md:block
              font-semibold
              transition

              ${scrolled ? "text-slate-700" : "text-white"}

              hover:text-emerald-500

            `}
          >
            Login
          </button>

          {/* Register */}

          <button
            className="
              hidden
              md:block
              border
              border-emerald-500
              text-emerald-600
              px-5
              py-3
              rounded-full
              font-semibold
              hover:bg-emerald-50
              transition
            "
          >
            Register
          </button>

          {/* Demo */}

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
              transition
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
