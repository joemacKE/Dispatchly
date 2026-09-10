import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

import getRoleHome from "./getRoleHome";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user } = useAuth();

  if (token && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
}
