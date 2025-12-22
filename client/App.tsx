import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Home } from "./pages/Home";
import { AuditTrail } from "./pages/AuditTrail";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { FarmOnboarding } from "./pages/FarmOnboarding";
import NotFound from "./pages/NotFound";
import { AnimatePresence } from "framer-motion";
import { AuthContextProvider } from "./context/AuthContext";
import { FarmContextProvider } from "./context/FarmContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Farm } from "./pages/Farm";
import { Weather } from "./pages/Weather";
import { Recommendations } from "./pages/Recommendations";
import { Marketplace } from "./pages/Marketplace";
import { Learn } from "./pages/Learn";
import { Community } from "./pages/Community";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding Route (authenticated only, before dashboard) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <FarmOnboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farm"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Farm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/weather"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Weather />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Recommendations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Marketplace />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Learn />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Community />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-trail"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <AuditTrail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthContextProvider>
        <FarmContextProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </FarmContextProvider>
      </AuthContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
