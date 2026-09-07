import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  return (
    <nav
      className="
      fixed
      top-0
      left-0
      right-0
      z-50
      bg-white/5
      backdrop-blur-md
      border-b
      border-white/10
      "
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
            className="
            w-10
            h-10
            rounded-xl
            bg-emerald-500
            flex
            items-center
            justify-center
            font-black
            text-white
            "
          >
            D
          </div>

          <span
            className="
            text-white
            text-2xl
            font-bold
            "
          >
            Dispatchly
          </span>
        </div>

        {/* Links */}

        <div
          className="
          hidden
          md:flex
          gap-10
          text-white
          font-medium
          "
        >
          <a>Solutions</a>

          <a>Features</a>

          <a>How it Works</a>

          <a>Resources</a>

          <a>Why Dispatchly</a>
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
            className="
            hidden
            md:block
            text-white
            "
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
