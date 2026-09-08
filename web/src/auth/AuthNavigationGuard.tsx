import { useEffect } from "react";

import { useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

export default function AuthNavigationGuard() {
  const { token } = useAuth();

  const location = useLocation();

  useEffect(() => {
    /*
      Only protect authenticated sessions.
      Browser navigation inside the app
      should remain normal.
    */

    if (!token) {
      return;
    }

    /*
      Replace history state so refresh/back
      does not accidentally create stale entries.
    */

    window.history.replaceState(
      {
        authenticated: true,
      },
      "",
      window.location.href,
    );
  }, [token, location.pathname]);

  return null;
}
