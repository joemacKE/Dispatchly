import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faLinkedin,
  faInstagram,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  return (
    <footer
      className="
bg-[#071A17]
text-white
pt-20
pb-8
"
    >
      <div
        className="
max-w-7xl
mx-auto
px-6
"
      >
        <div
          className="
grid
lg:grid-cols-5
gap-12
"
        >
          {/* Brand */}

          <div
            className="
lg:col-span-2
"
          >
            <h2
              className="
text-3xl
font-black
"
            >
              Dispatchly
            </h2>

            <p
              className="
mt-5
text-white/70
max-w-sm
leading-relaxed
"
            >
              Connected delivery. Smarter operations. Dispatchly connects
              retailers, dispatchers and riders through one intelligent delivery
              coordination platform.
            </p>

            <button
              className="
mt-8
flex
items-center
gap-3
bg-emerald-500
px-6
py-3
rounded-xl
font-bold
hover:bg-emerald-400
transition
"
            >
              Request Demo
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          {/* Product */}

          <div>
            <h3
              className="
font-bold
text-lg
"
            >
              Product
            </h3>

            <ul
              className="
mt-5
space-y-3
text-white/70
"
            >
              <li>Platform</li>

              <li>Features</li>

              <li>Solutions</li>

              <li>Request Demo</li>
            </ul>
          </div>

          {/* Company */}

          <div>
            <h3
              className="
font-bold
text-lg
"
            >
              Company
            </h3>

            <ul
              className="
mt-5
space-y-3
text-white/70
"
            >
              <li>About</li>

              <li>Contact</li>

              <li>Partners</li>

              <li>Careers</li>
            </ul>
          </div>

          {/* Resources */}

          <div>
            <h3
              className="
font-bold
text-lg
"
            >
              Resources
            </h3>

            <ul
              className="
mt-5
space-y-3
text-white/70
"
            >
              <li>Documentation</li>

              <li>Support</li>

              <li>Privacy Policy</li>

              <li>Terms</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}

        <div
          className="
mt-16
pt-8
border-t
border-white/10
flex
flex-col
md:flex-row
justify-between
gap-6
items-center
"
        >
          <p
            className="
text-white/50
text-sm
"
          >
            © 2026 Dispatchly. All rights reserved.
          </p>

          <div
            className="
flex
gap-5
"
          >
            <a
              className="
text-white/60
hover:text-emerald-400
transition
"
            >
              <FontAwesomeIcon icon={faLinkedin} />
            </a>

            <a
              className="
text-white/60
hover:text-emerald-400
transition
"
            >
              <FontAwesomeIcon icon={faXTwitter} />
            </a>

            <a
              className="
text-white/60
hover:text-emerald-400
transition
"
            >
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
