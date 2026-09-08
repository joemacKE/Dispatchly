import { useState, type FormEvent, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faEye, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../auth/AuthContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const { login, user } = useAuth();

  const navigate = useNavigate();

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
      setPassword("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function redirectUser() {
    if (!user) {
      return;
    }

    if (user.role === "rider") {
      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

    if (user.role === "dispatcher") {
      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

    navigate("/dashboard", {
      replace: true,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    setError("");

    try {
      await login(phone.trim(), password);

      /*
       * Authentication state updates after login.
       * Redirect is handled after AuthContext updates.
       */

      setTimeout(() => {
        redirectUser();

        onClose();
      }, 100);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/60
        backdrop-blur-sm
        px-6
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          w-full
          max-w-md
          rounded-3xl
          bg-white
          p-8
          shadow-2xl
        "
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="
            absolute
            right-5
            top-5
            text-slate-400
            hover:text-slate-700
          "
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="text-center">
          <div
            className="
              mx-auto
              w-14
              h-14
              rounded-2xl
              bg-emerald-500
              text-white
              flex
              items-center
              justify-center
              font-black
              text-xl
            "
          >
            D
          </div>

          <h2
            className="
              mt-5
              text-3xl
              font-black
              text-slate-900
            "
          >
            Welcome back
          </h2>

          <p
            className="
              mt-2
              text-slate-500
            "
          >
            Continue managing deliveries smarter.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="
            mt-8
            space-y-5
          "
        >
          <label
            className="
              block
              text-sm
              font-semibold
              text-slate-700
            "
          >
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+254..."
              autoComplete="username"
              required
              disabled={loading}
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                outline-none
                focus:border-emerald-500
              "
            />
          </label>

          <label
            className="
              block
              text-sm
              font-semibold
              text-slate-700
            "
          >
            Password
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  pr-12
                  outline-none
                  focus:border-emerald-500
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute
                  right-4
                  top-5
                  text-slate-400
                "
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </label>

          {error && (
            <div
              role="alert"
              className="
                  rounded-xl
                  bg-red-50
                  text-red-600
                  p-3
                  text-sm
                "
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim() || !password}
            className="
              w-full
              rounded-xl
              bg-emerald-500
              py-4
              text-white
              font-bold
              hover:bg-emerald-600
              transition
              disabled:opacity-50
            "
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
