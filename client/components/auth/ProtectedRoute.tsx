import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = false,
}) => {
  const { isAuthenticated, user, isLoading, isDemoUser, skipLoginAsDemo } =
    useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.id)) {
      skipLoginAsDemo();
    }
  }, [isAuthenticated, isLoading, skipLoginAsDemo, user?.id]);

  // Debug: Log session status
  React.useEffect(() => {
    console.log("=== PROTECTED ROUTE DEBUG ===");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("user:", user ? `${user.fullName} (${user.id})` : "null");
    console.log("requireOnboarding:", requireOnboarding);
    console.log("user?.hasCompletedOnboarding:", user?.hasCompletedOnboarding);
    console.log(
      "localStorage.current_user:",
      localStorage.getItem("current_user") ? "EXISTS" : "MISSING",
    );
    console.log(
      "localStorage.onboarding_completed:",
      localStorage.getItem("onboarding_completed"),
    );
    console.log("=============================");
  }, [isAuthenticated, user, requireOnboarding]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No user yet - hydrate demo session without redirecting
  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Starting demo session...</p>
        </div>
      </div>
    );
  }

  // Check onboarding requirement
  if (requireOnboarding && !user?.hasCompletedOnboarding) {
    console.log(
      "[ProtectedRoute] Onboarding required but not complete, redirecting to onboarding",
    );
    return <Navigate to="/onboarding" replace />;
  }

  // Demo users should not stay on onboarding page
  if (isDemoUser && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed
  return <>{children}</>;
};
