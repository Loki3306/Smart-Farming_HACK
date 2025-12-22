import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "../../lib/utils";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50">
      <Sidebar />
      
      {/* Main Content */}
      <main className="lg:pl-64 transition-all duration-300">
        <div className="min-h-screen">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};
