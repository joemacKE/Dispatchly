import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faBuilding,
  faMotorcycle,
  faUsersGear,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  open: boolean;

  onClose: () => void;
};

const roles = [
  {
    id: "retailer",
    title: "Retailer",
    description: "Grow your business with smarter deliveries.",
    icon: faBuilding,
  },

  {
    id: "dispatcher",
    title: "Dispatcher",
    description: "Coordinate delivery operations efficiently.",
    icon: faUsersGear,
  },

  {
    id: "rider",
    title: "Rider",
    description: "Manage deliveries and earn more.",
    icon: faMotorcycle,
  },
];

export default function RegisterModal({
  open,

  onClose,
}: Props) {
  const [selectedRole, setSelectedRole] = useState("");

  if (!open) {
    return null;
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
max-w-lg
w-full
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
            Join Dispatchly
          </h2>

          <p
            className="
mt-2
text-slate-500
"
          >
            Choose how you want to use Dispatchly.
          </p>
        </div>

        <div
          className="
mt-8
space-y-4
"
        >
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`
w-full
text-left
p-5
rounded-2xl
border
transition

${
  selectedRole === role.id
    ? "border-emerald-500 bg-emerald-50"
    : "border-slate-200 hover:border-emerald-300"
}

`}
            >
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
rounded-xl
bg-emerald-100
text-emerald-600
flex
items-center
justify-center
"
                >
                  <FontAwesomeIcon icon={role.icon} />
                </div>

                <div>
                  <h3
                    className="
font-bold
text-slate-900
"
                  >
                    {role.title}
                  </h3>

                  <p
                    className="
text-sm
text-slate-500
"
                  >
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          disabled={!selectedRole}
          className="
mt-8
w-full
rounded-xl
bg-emerald-500
py-4
text-white
font-bold
disabled:opacity-50
"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
