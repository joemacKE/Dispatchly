import { useState } from "react";

import Navbar from "./Navbar";

import LoginModal from "../auth/LoginModal";
import RegisterModal from "../auth/RegistrationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faArrowRight, faPlay } from "@fortawesome/free-solid-svg-icons";

export default function Hero() {
  const [loginOpen, setLoginOpen] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  return (
    <section
      id="home"
      className="
relative
min-h-screen
overflow-hidden
"
    >
      {/* Background */}

      <img
        src="/assets/dispatchly-hero.png"
        alt="Dispatchly delivery operations"
        className="
absolute
inset-0
w-full
h-full
object-cover
"
      />

      {/* Gradient */}

      <div
        className="
absolute
inset-0
bg-gradient-to-r
from-black/80
via-black/50
to-black/20
"
      />

      <Navbar
        onLogin={() => setLoginOpen(true)}
        onRegister={() => setRegisterOpen(true)}
      />

      {/* Content */}

      <div
        className="
relative
z-10
max-w-7xl
mx-auto
px-6
pt-40
"
      >
        <div
          className="
max-w-3xl
"
        >
          <p
            className="
text-emerald-400
uppercase
tracking-[0.35em]
font-bold
text-sm
"
          >
            People. Deliveries. Growth.
          </p>

          <h1
            className="
mt-8
text-white
text-5xl
md:text-7xl
font-black
leading-tight
"
          >
            Every delivery.
            <br />
            <span
              className="
text-emerald-400
"
            >
              A stronger tomorrow.
            </span>
          </h1>

          <p
            className="
mt-8
text-xl
text-white/80
max-w-2xl
leading-relaxed
"
          >
            Dispatchly connects retailers, dispatchers and riders through one
            intelligent delivery coordination platform built for visibility,
            accountability and growth.
          </p>

          <div
            className="
mt-10
flex
gap-5
"
          >
            <button
              className="
bg-emerald-500
px-8
py-4
rounded-xl
font-bold
text-white
flex
gap-3
items-center
"
            >
              Request Demo
              <FontAwesomeIcon icon={faArrowRight} />
            </button>

            <button
              className="
border
border-white/40
bg-white/10
backdrop-blur
px-8
py-4
rounded-xl
text-white
font-semibold
flex
gap-3
items-center
"
            >
              <FontAwesomeIcon icon={faPlay} />
              See How It Works
            </button>
          </div>

          {/* Trust indicators */}

          <div
            className="
mt-16
flex
gap-12
text-white
"
          >
            <div>
              <strong
                className="
text-2xl
"
              >
                99%
              </strong>

              <p>Delivery Visibility</p>
            </div>

            <div>
              <strong
                className="
text-2xl
"
              >
                24/7
              </strong>

              <p>Operations Control</p>
            </div>

            <div>
              <strong
                className="
text-2xl
"
              >
                3
              </strong>

              <p>Connected Networks</p>
            </div>
          </div>
        </div>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </section>
  );
}
