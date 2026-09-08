import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

type Props = {
  children: ReactNode;

  allowedRoles?: string[];
};

export default function ProtectedRoute({
  children,

  allowedRoles,
}: Props) {
  const { token, user } = useAuth();

  /*
   * No authentication
   */

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  /*
   * Authentication exists,
   * check authorization
   */

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={
          user.role === "rider"
            ? "/rider"
            : user.role === "dispatcher"
              ? "/dispatcher"
              : "/dashboard"
        }
        replace
      />
    );
  }

  return children;
}
