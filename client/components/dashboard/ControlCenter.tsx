import React, { useState } from "react";
import { Droplet, Leaf, Zap, Settings, Bot, Hand } from "lucide-react";
import { useFarmContext } from "../../context/FarmContext";
import { useTranslation } from "react-i18next";

export const ControlCenter: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const {
    systemStatus,
    setAutonomous,
    triggerWaterPump,
    triggerFertilizer,
    loading,
  } = useFarmContext();
  const [pumpLoading, setPumpLoading] = useState(false);
  const [fertilizerLoading, setFertilizerLoading] = useState(false);

  // Local state for actuation status (default to off)
  const [irrigationOn, setIrrigationOn] = useState(false);
  const [fertilizerOn, setFertilizerOn] = useState(false);

  // Toggle Water Pump
  const handleWaterPump = async () => {
    if (systemStatus?.isAutonomous) return;
    setPumpLoading(true);
    try {
      const newState = !irrigationOn;
      await triggerWaterPump(newState);
      setIrrigationOn(newState);
    } finally {
      setPumpLoading(false);
    }
  };

  // Toggle Fertilizer
  const handleFertilizer = async () => {
    if (systemStatus?.isAutonomous) return;
    setFertilizerLoading(true);
    try {
      const newState = !fertilizerOn;
      await triggerFertilizer(newState);
      setFertilizerOn(newState);
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
          <h3 className="text-lg font-semibold text-foreground">{t("control.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("control.subtitle")}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-200/50 dark:bg-amber-700/30 flex items-center justify-center">
          <Settings className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
              {t("control.systemMode")}
            </div>
            <div className="text-xs text-muted-foreground">
              {systemStatus?.isAutonomous
                ? <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> {t("control.autonomous")}</span>
                : <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> {t("control.manual")}</span>
              }
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
        {/* Irrigation Toggle Button */}
        <button
          onClick={handleWaterPump}
          disabled={systemStatus?.isAutonomous || pumpLoading}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group ${systemStatus?.isAutonomous
              ? 'bg-amber-100/30 dark:bg-amber-800/20 border-amber-200/30 dark:border-amber-700/30 cursor-not-allowed opacity-60'
              : irrigationOn
                ? 'bg-blue-600 dark:bg-blue-700 border-blue-500 shadow-md transform hover:scale-[1.01]'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${irrigationOn ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
            }`}>
            <Droplet className={`w-6 h-6 ${irrigationOn && pumpLoading ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 text-left">
            <div className={`font-semibold ${irrigationOn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {pumpLoading
                ? (irrigationOn ? "Stopping..." : "Starting...")
                : (irrigationOn ? "Stop Irrigation" : "Start Irrigation")
              }
            </div>
            <div className={`text-xs ${irrigationOn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {irrigationOn ? "System Active - Dispensing Water" : "System Idle"}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${irrigationOn
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
            {irrigationOn ? "ON" : "OFF"}
          </div>
        </button>

        {/* Fertilizer Toggle Button */}
        <button
          onClick={handleFertilizer}
          disabled={systemStatus?.isAutonomous || fertilizerLoading}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group ${systemStatus?.isAutonomous
              ? 'bg-amber-100/30 dark:bg-amber-800/20 border-amber-200/30 dark:border-amber-700/30 cursor-not-allowed opacity-60'
              : fertilizerOn
                ? 'bg-green-600 dark:bg-green-700 border-green-500 shadow-md transform hover:scale-[1.01]'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${fertilizerOn ? 'bg-white/20 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
            }`}>
            <Leaf className={`w-6 h-6 ${fertilizerOn && fertilizerLoading ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 text-left">
            <div className={`font-semibold ${fertilizerOn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {fertilizerLoading
                ? (fertilizerOn ? "Stopping..." : "Starting...")
                : (fertilizerOn ? "Stop Fertilizer" : "Start Fertilizer")
              }
            </div>
            <div className={`text-xs ${fertilizerOn ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {fertilizerOn ? "System Active - Dispensing Nutrients" : "System Idle"}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${fertilizerOn
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
            {fertilizerOn ? "ON" : "OFF"}
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
            {t("control.aiActive")}
          </p>
        </div>
      )}

      {/* System Status Footer */}
      <div className="mt-5 pt-4 border-t border-amber-200/30 dark:border-amber-700/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("control.systemStatus")}</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${systemStatus?.isOnline
                ? "bg-green-500 animate-pulse"
                : "bg-red-500"
                }`}
            />
            <span className="text-sm font-semibold text-foreground">
              {systemStatus?.isOnline ? t("control.online") : t("control.offline")}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {t("control.lastUpdated")}:{" "}
          {systemStatus?.lastUpdate
            ? new Date(systemStatus.lastUpdate).toLocaleTimeString()
            : "—"}
        </div>
      </div>
    </div>
  );
};
