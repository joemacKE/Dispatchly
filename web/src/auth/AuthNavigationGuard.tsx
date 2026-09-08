import { useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

export default function AuthNavigationGuard() {
  const { token, user, logout } = useAuth();

  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    function handlePopState() {
      if (token && user && location.pathname !== "/") {
        const confirmLogout = window.confirm(
          "You are leaving Dispatchly. Do you want to logout?",
        );

        if (confirmLogout) {
          logout();

          navigate("/", {
            replace: true,
          });
        } else {
          navigate(location.pathname, {
            replace: true,
          });
        }
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [token, user, location.pathname, logout, navigate]);

  return null;
}
