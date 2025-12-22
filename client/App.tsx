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
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requireOnboarding>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-trail"
          element={
            <ProtectedRoute requireOnboarding>
              <AuditTrail />
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
