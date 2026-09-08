import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user } = useAuth();

  if (token && user) {
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
