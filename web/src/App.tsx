import { Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import DispatcherDashboardPage from "./pages/DispatcherDashboardPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";
import LandingPage from "./pages/LandingPage";

import ProtectedRoute from "./auth/ProtectedRoute";
import AuthNavigationGuard from "./auth/AuthNavigationGuard";
import PublicRoute from "./auth/PublicationRoute";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <>
      {/* Authentication history protection */}
      <AuthNavigationGuard />

      <Routes>
        {/* Public landing page */}

        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        {/* Protected dashboards */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["retailer"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dispatcher"
          element={
            <ProtectedRoute allowedRoles={["dispatcher"]}>
              <DispatcherDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
