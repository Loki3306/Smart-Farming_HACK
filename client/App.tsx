import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home";
import { AuditTrail } from "./pages/AuditTrail";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { FarmOnboarding } from "./pages/FarmOnboarding";
import NotFound from "./pages/NotFound";
import { AuthContextProvider } from "./context/AuthContext";
import { FarmContextProvider } from "./context/FarmContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthContextProvider>
        <FarmContextProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
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
                path="/audit-trail"
                element={
                  <ProtectedRoute requireOnboarding>
                    <AuditTrail />
                  </ProtectedRoute>
                }
              />

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FarmContextProvider>
      </AuthContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
