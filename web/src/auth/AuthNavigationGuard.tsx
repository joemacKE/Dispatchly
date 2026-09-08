import { useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

export default function AuthNavigationGuard() {
  const { token, user, logout } = useAuth();

  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    /*
     * Replace current history entry
     * so browser navigation is controlled
     */

    window.history.pushState(null, "", window.location.href);

    function handlePopState() {
      const confirmLogout = window.confirm(
        "Leaving Dispatchly will log you out. Continue?",
      );

      if (confirmLogout) {
        logout();

        navigate("/", {
          replace: true,
        });
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [token, user, logout, navigate, location.pathname]);

  return null;
}
