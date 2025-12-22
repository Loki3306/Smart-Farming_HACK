import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = false,
}) => {
  const { isAuthenticated, user, isLoading, isDemoUser } = useAuth();

  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated, 'user:', user, 'requireOnboarding:', requireOnboarding);

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

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check onboarding requirement
  if (requireOnboarding && !user?.hasCompletedOnboarding) {
    console.log('[ProtectedRoute] Onboarding required but not complete, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  // Demo users cannot access onboarding flow
  if (isDemoUser && requireOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed
  return <>{children}</>;
};
