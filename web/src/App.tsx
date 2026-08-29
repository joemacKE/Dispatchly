import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";

function HomeRoute() {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate to={user.role === "rider" ? "/rider" : "/dashboard"} replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />

      <Route path="/rider" element={<RiderDashboardPage />} />

      <Route path="*" element={<HomeRoute />} />
    </Routes>
  );
}
