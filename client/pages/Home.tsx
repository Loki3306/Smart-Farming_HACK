import React, { useEffect } from "react";
import { MapPin, Activity } from "lucide-react";
import { SoilMoisture } from "../components/dashboard/SoilMoisture";
import { WeatherCard } from "../components/dashboard/WeatherCard";
import { ControlCenter } from "../components/dashboard/ControlCenter";
import { ActionLog } from "../components/dashboard/ActionLog";
import { useFarmContext } from "../context/FarmContext";
import { useInterval } from "../hooks/useInterval";

export const Home: React.FC = () => {
  const { refreshSensorData, refreshWeather, refreshBlockchain, systemStatus } =
    useFarmContext();

  // Initial load
  useEffect(() => {
    refreshSensorData();
    refreshWeather();
    refreshBlockchain();
  }, [refreshSensorData, refreshWeather, refreshBlockchain]);

  // Auto-refresh sensor data every 5 seconds
  useInterval(() => {
    refreshSensorData();
  }, 5000);

  // Auto-refresh weather every 30 seconds
  useInterval(() => {
    refreshWeather();
  }, 30000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Smart Irrigation Dashboard
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                AI-powered autonomous farming system
              </p>
            </div>

            {/* System Status Indicator */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">System</div>
                  <div className="font-semibold text-foreground">
                    {systemStatus?.isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            <span>{systemStatus?.location || "Loading location..."}</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Soil Moisture Hero */}
            <SoilMoisture />

            {/* Weather Card */}
            <WeatherCard />
          </div>

          {/* Right Column - Controls & Sidebar */}
          <div className="space-y-6">
            {/* Control Center */}
            <ControlCenter />

            {/* Action Log */}
            <ActionLog />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-border/20 text-center text-sm text-muted-foreground">
          <p>
            Real-time sensor data • Blockchain-verified actions • AI-powered
            optimization
          </p>
        </div>
      </div>
    </div>
  );
};
