import { Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import DispatcherDashboardPage from "./pages/DispatcherDashboardPage";
import LoginPage from "./pages/LoginPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />

      <Route path="/dispatcher" element={<DispatcherDashboardPage />} />

      <Route path="/rider" element={<RiderDashboardPage />} />
    </Routes>
  );
}
