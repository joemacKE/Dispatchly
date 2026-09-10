import { useState, type FormEvent } from "react";

import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faEye,
  faEyeSlash,
  faXmark,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../auth/AuthContext";
import getRoleHome from "../../auth/getRoleHome";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Role = "retailer" | "dispatcher" | "rider";

export default function RegisterModal({ open, onClose }: Props) {
  const { register } = useAuth();

  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("retailer");

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [businessCode, setBusinessCode] = useState("");

  const [businessName, setBusinessName] = useState("");

  const [businessType, setBusinessType] = useState<
    "electronics" | "pharmacy" | "hardware" | "other"
  >("electronics");

  const [businessAddress, setBusinessAddress] = useState("");

  const [businessPhone, setBusinessPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  function redirectUser(userRole: Role) {
    navigate(getRoleHome(userRole), {
      replace: true,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    setError("");

    try {
      const user = await register({
        role,

        ...(role === "retailer"
          ? {
              business: {
                name: businessName,

                type: businessType,

                address: businessAddress,

                phone: businessPhone,
              },
            }
          : {
              business_code: businessCode.trim(),
            }),

        name: name.trim(),

        phone: phone.trim(),

        password,
      });

      onClose();

      redirectUser(user.role);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create account",
      );
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
max-w-lg
max-h-[90vh]
overflow-y-auto
rounded-3xl
bg-white
p-8
shadow-2xl
"
        onClick={(e) => e.stopPropagation()}
      >
        <button
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
            Create account
          </h2>

          <p
            className="
mt-2
text-slate-500
"
          >
            Join Dispatchly delivery network.
          </p>
        </div>

        <div
          className="
mt-8
grid
grid-cols-3
gap-3
"
        >
          {[
            {
              id: "retailer",
              label: "Retailer",
            },

            {
              id: "dispatcher",
              label: "Dispatcher",
            },

            {
              id: "rider",
              label: "Rider",
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id as Role)}
              className={`
rounded-xl
p-3
font-semibold

${
  role === item.id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700"
}

`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="
mt-8
space-y-4
"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className="input"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            required
            className="input"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="input pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="
absolute
right-4
top-3
text-slate-400
"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          {role === "retailer" ? (
            <>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                required
                className="input"
              />

              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as any)}
                className="input"
              >
                <option value="electronics">Electronics</option>

                <option value="pharmacy">Pharmacy</option>

                <option value="hardware">Hardware</option>

                <option value="other">Other</option>
              </select>

              <input
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Business address"
                required
                className="input"
              />

              <input
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="Business phone"
                required
                className="input"
              />
            </>
          ) : (
            <input
              value={businessCode}
              onChange={(e) => setBusinessCode(e.target.value)}
              placeholder="Business code e.g. MUGA-42946"
              required
              className="input"
            />
          )}

          {error && (
            <div
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
            disabled={loading}
            className="
w-full
rounded-xl
bg-emerald-500
py-4
text-white
font-bold
flex
items-center
justify-center
gap-3
disabled:opacity-50
"
          >
            {loading ? (
              "Creating account..."
            ) : (
              <>
                Create Account
                <FontAwesomeIcon icon={faArrowRight} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
