import React, { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "../../lib/utils";
import { TourManager } from "../tour/TourManager";
import { DashboardGuide } from "../DashboardGuide";

import { useUserPresence } from "@/hooks/useUserPresence";
import { useAuth } from "@/context/AuthContext";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

// Map routes to their corresponding tour IDs
const routeTourMap: Record<string, string> = {
  '/dashboard': 'main-tour',
  '/farm': 'farm-tour',
  '/weather': 'weather-tour',
  '/recommendations': 'recommendations-tour',
  '/regimes': 'regimes-tour',
  '/marketplace': 'marketplace-tour',
  '/learn': 'learn-tour',
  '/community': 'community-tour',
  '/notifications': 'notifications-tour',
  // Add more routes and tours here as needed
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Track user presence (online/away/offline)
  useUserPresence();

  // Determine which tour to show based on current route
  const currentTourId = useMemo(() => {
    return routeTourMap[location.pathname] || null;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-texture-dashboard bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main Content */}
      <main className={cn("transition-all duration-300 pt-16 lg:pt-0", isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <div className="min-h-screen">
          {children || <Outlet />}
        </div>
      </main>

      {/* Tour System - Route-aware */}
      {currentTourId && (
        <TourManager key={currentTourId} tourId={currentTourId} autoStart />
      )}
      <DashboardGuide />


    </div>
  );
};
