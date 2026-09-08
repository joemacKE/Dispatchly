import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

type Props = {
  children: ReactNode;

  allowedRoles?: string[];
};

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export default function ProtectedRoute({
  children,

  allowedRoles,
}: Props) {
  const { token, user, logout } = useAuth();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (isTokenExpired(token)) {
    logout();

    return <Navigate to="/" replace />;
  }

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
