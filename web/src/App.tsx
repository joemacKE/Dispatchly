import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";

import DashboardPage from "./pages/DashboardPage";
import DispatcherDashboardPage from "./pages/DispatcherDashboardPage";
import LoginPage from "./pages/LoginPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";

function HomeRoute() {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "rider") {
    return <Navigate to="/rider" replace />;
  }

  if (user.role === "dispatcher") {
    return <Navigate to="/dispatcher" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />

      <Route path="/dispatcher" element={<DispatcherDashboardPage />} />

      <Route path="/rider" element={<RiderDashboardPage />} />

      <Route path="*" element={<HomeRoute />} />
    </Routes>
  );
}
