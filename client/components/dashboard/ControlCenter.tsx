import React, { useState } from "react";
import { Droplet, Leaf, Zap } from "lucide-react";
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
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/20 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/30 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Control Center</h3>
          <p className="text-sm text-muted-foreground">Manage farm systems</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-200/50 dark:bg-amber-700/30 flex items-center justify-center">
          <span className="text-lg">⚙️</span>
        </div>
      </div>

      {/* Autonomous Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-800/30 dark:to-orange-800/30 backdrop-blur-sm rounded-xl border border-amber-200/40 dark:border-amber-700/40 hover:shadow-md transition-all duration-300 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${systemStatus?.isAutonomous
            ? 'bg-green-500/20 dark:bg-green-500/30'
            : 'bg-amber-200/50 dark:bg-amber-700/40'
            }`}>
            <Zap className={`w-6 h-6 transition-colors ${systemStatus?.isAutonomous
              ? 'text-green-600 dark:text-green-400'
              : 'text-amber-600 dark:text-amber-400'
              }`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              System Mode
            </div>
            <div className="text-xs text-muted-foreground">
              {systemStatus?.isAutonomous ? "🤖 Autonomous" : "👆 Manual"} Control
            </div>
          </div>
        </div>
        <button
          onClick={handleAutonomousToggle}
          disabled={loading}
          className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all shadow-inner ${systemStatus?.isAutonomous
            ? "bg-green-500 dark:bg-green-600"
            : "bg-amber-300/80 dark:bg-amber-600/60"
            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${systemStatus?.isAutonomous ? "translate-x-9" : "translate-x-1"
              }`}
          />
        </button>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleWaterPump}
          disabled={systemStatus?.isAutonomous || pumpLoading}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${systemStatus?.isAutonomous || pumpLoading
            ? 'bg-amber-100/30 dark:bg-amber-800/20 border-amber-200/30 dark:border-amber-700/30 cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-blue-100/60 to-cyan-100/60 dark:from-blue-800/30 dark:to-cyan-800/30 border-blue-200/50 dark:border-blue-700/40 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${systemStatus?.isAutonomous || pumpLoading
            ? 'bg-amber-200/30 dark:bg-amber-700/30'
            : 'bg-blue-500/20 dark:bg-blue-500/30'
            }`}>
            <Droplet className={`w-6 h-6 ${systemStatus?.isAutonomous || pumpLoading
              ? 'text-muted-foreground'
              : 'text-blue-600 dark:text-blue-400'
              }`} />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-foreground">
              {pumpLoading ? "💧 Dispensing Water..." : "Water Pump"}
            </div>
            <div className="text-xs text-muted-foreground">
              Manual irrigation trigger
            </div>
          </div>
        </button>

        <button
          onClick={handleFertilizer}
          disabled={systemStatus?.isAutonomous || fertilizerLoading}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${systemStatus?.isAutonomous || fertilizerLoading
            ? 'bg-amber-100/30 dark:bg-amber-800/20 border-amber-200/30 dark:border-amber-700/30 cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-green-100/60 to-emerald-100/60 dark:from-green-800/30 dark:to-emerald-800/30 border-green-200/50 dark:border-green-700/40 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${systemStatus?.isAutonomous || fertilizerLoading
            ? 'bg-amber-200/30 dark:bg-amber-700/30'
            : 'bg-green-500/20 dark:bg-green-500/30'
            }`}>
            <Leaf className={`w-6 h-6 ${systemStatus?.isAutonomous || fertilizerLoading
              ? 'text-muted-foreground'
              : 'text-green-600 dark:text-green-400'
              }`} />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-foreground">
              {fertilizerLoading ? "🌿 Dispensing Nutrients..." : "Fertilizer"}
            </div>
            <div className="text-xs text-muted-foreground">
              Manual nutrient application
            </div>
          </div>
        </button>
      </div>

      {/* Autonomous Mode Info */}
      {systemStatus?.isAutonomous && (
        <div className="mt-4 bg-gradient-to-r from-green-100/60 to-emerald-100/60 dark:from-green-800/30 dark:to-emerald-800/30 border border-green-200/50 dark:border-green-700/40 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            AI is managing operations automatically.
          </p>
        </div>
      )}

      {/* System Status Footer */}
      <div className="mt-5 pt-4 border-t border-amber-200/30 dark:border-amber-700/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">System Status</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${systemStatus?.isOnline
                ? "bg-green-500 animate-pulse"
                : "bg-red-500"
                }`}
            />
            <span className="text-sm font-semibold text-foreground">
              {systemStatus?.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Last updated:{" "}
          {systemStatus?.lastUpdate
            ? new Date(systemStatus.lastUpdate).toLocaleTimeString()
            : "—"}
        </div>
      </div>
    </div>
  );
};
