import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "../../lib/utils";
import { TourManager } from "../tour/TourManager";
import { DashboardGuide } from "../DashboardGuide";
import { Chatbot } from "../chat/Chatbot";
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
  '/marketplace': 'marketplace-tour',
  '/learn': 'learn-tour',
  '/community': 'community-tour',
  '/notifications': 'notifications-tour',
  // Add more routes and tours here as needed
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Track user presence (online/away/offline)
  useUserPresence();

  // Determine which tour to show based on current route
  const currentTourId = useMemo(() => {
    return routeTourMap[location.pathname] || null;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:pl-64 transition-all duration-300">
        <div className="min-h-screen">
          {children || <Outlet />}
        </div>
      </main>

      {/* Tour System - Route-aware */}
      {currentTourId && (
        <TourManager key={currentTourId} tourId={currentTourId} autoStart />
      )}
      <DashboardGuide />

      {/* AI Chatbot - Floating widget */}
      <Chatbot floating={true} compact={true} />
    </div>
  );
};
