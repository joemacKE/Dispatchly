import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

import NotificationBell from "./NotificationBell";

type Props = {
  live?: boolean;
};

export default function Navbar({ live = false }: Props) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="topbar relative z-50">
      <div className="brand-row">
        <div className="brand-mark small">R</div>

        <div>
          <strong>Reflex</strong>

          <span>Delivery Coordination</span>
        </div>
      </div>

      <div className="user-row">
        {/* Live Connection Status */}

        <span className={live ? "live-pill online" : "live-pill"}>
          {live ? "● Live" : "○ Connecting"}
        </span>

        {/* Notification Center */}

        <NotificationBell />

        {/* Profile Dropdown */}

        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="
            flex
            items-center
            gap-3
            rounded-full
            border
            border-slate-200
            bg-white
            px-4
            py-2
            shadow-sm
            hover:bg-slate-50
            "
          >
            <div
              className="
              w-10
              h-10
              rounded-full
              bg-emerald-500
              text-white
              flex
              items-center
              justify-center
              font-bold
              "
            >
              {user?.name?.charAt(0)}
            </div>

            <div className="text-left">
              <strong
                className="
                block
                text-sm
                text-slate-900
                "
              >
                {user?.name}
              </strong>

              <span
                className="
                text-xs
                text-slate-500
                capitalize
                "
              >
                {user?.role}
              </span>
            </div>

            <span>▾</span>
          </button>

          {profileMenuOpen && (
            <div
              className="
                absolute
                right-0
                mt-3
                w-64
                rounded-2xl
                bg-white
                border
                border-slate-200
                shadow-xl
                p-3
                "
            >
              <button
                className="
                  w-full
                  text-left
                  px-4
                  py-3
                  rounded-xl
                  hover:bg-slate-100
                  "
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>

              <button
                className="
                  w-full
                  text-left
                  px-4
                  py-3
                  rounded-xl
                  hover:bg-slate-100
                  "
              >
                Settings
              </button>

              <button
                className="
                  w-full
                  text-left
                  px-4
                  py-3
                  rounded-xl
                  hover:bg-red-50
                  text-red-600
                  "
                onClick={() => {
                  logout();

                  navigate("/", {
                    replace: true,
                  });
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
