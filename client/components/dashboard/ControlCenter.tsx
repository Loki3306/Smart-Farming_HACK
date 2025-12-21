import React, { useState } from "react";
import { Droplet, Leaf, Zap } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useFarmContext } from "../../context/FarmContext";

export const ControlCenter: React.FC = () => {
  const {
    systemStatus,
    setAutonomous,
    triggerWaterPump,
    triggerFertilizer,
    loading,
  } = useFarmContext();
  const [pumpLoading, setPumpLoading] = useState(false);
  const [fertilizerLoading, setFertilizerLoading] = useState(false);

  const handleWaterPump = async () => {
    setPumpLoading(true);
    try {
      await triggerWaterPump();
    } finally {
      setPumpLoading(false);
    }
  };

  const handleFertilizer = async () => {
    setFertilizerLoading(true);
    try {
      await triggerFertilizer();
    } finally {
      setFertilizerLoading(false);
    }
  };

  const handleAutonomousToggle = async () => {
    await setAutonomous(!systemStatus?.isAutonomous);
  };

  return (
    <Card glass className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">
          Control Center
        </h3>

        {/* Autonomous Badge */}
        <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                System Mode
              </div>
              <div className="text-xs text-muted-foreground">
                {systemStatus?.isAutonomous ? "Autonomous" : "Manual"} Mode
              </div>
            </div>
          </div>
          <button
            onClick={handleAutonomousToggle}
            disabled={loading}
            className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors ${
              systemStatus?.isAutonomous ? "bg-primary" : "bg-muted"
            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                systemStatus?.isAutonomous ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleWaterPump}
            disabled={systemStatus?.isAutonomous || pumpLoading}
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <Droplet className="w-4 h-4" />
            {pumpLoading ? "Dispensing..." : "Manual Water Pump"}
          </Button>

          <Button
            fullWidth
            onClick={handleFertilizer}
            disabled={systemStatus?.isAutonomous || fertilizerLoading}
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <Leaf className="w-4 h-4" />
            {fertilizerLoading ? "Dispensing..." : "Manual Fertilizer"}
          </Button>
        </div>

        {systemStatus?.isAutonomous && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-900">
              ✓ System is in Autonomous mode. Manual controls are disabled.
            </p>
          </div>
        )}

        {/* System Status */}
        <div className="border-t border-border/30 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Status</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  systemStatus?.isOnline
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-foreground">
                {systemStatus?.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated:{" "}
            {systemStatus?.lastUpdate
              ? new Date(systemStatus.lastUpdate).toLocaleTimeString()
              : "—"}
          </div>
        </div>
      </div>
    </Card>
  );
};
