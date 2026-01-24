import React, { useState, useEffect } from "react";
import { EnhancedGauge } from "../ui/EnhancedGauge";
import { useFarmContext } from "../../context/FarmContext";
import cropProfilesData from "../../../shared/crop_profiles.json";
import LottieFarmScene from "./LottieFarmScene";
import { SystemStatusChart } from "./SystemStatusChart";
import { Sprout, AlertTriangle, AlertOctagon, CheckCircle2, Droplets, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

// Type for crop profile thresholds
interface CropThresholds {
  moisture: [number, number];
  nitrogen: [number, number];
  phosphorus: [number, number];
  potassium: [number, number];
  ph: [number, number];
}

// Default thresholds (generic crop)
const DEFAULT_THRESHOLDS: CropThresholds = {
  moisture: [50, 70],
  nitrogen: [70, 130],
  phosphorus: [35, 65],
  potassium: [70, 120],
  ph: [6.0, 7.0],
};

// Get crop thresholds from crop_profiles.json
function getCropThresholds(cropName: string): CropThresholds {
  const crops = (cropProfilesData as any).crops || {};
  const cropKey = cropName?.toLowerCase().replace(/\s+/g, '') || 'default';

  const cropData = crops[cropKey]?.overall;
  if (!cropData) {
    return DEFAULT_THRESHOLDS;
  }

  return {
    moisture: cropData.moistureOptimal || DEFAULT_THRESHOLDS.moisture,
    nitrogen: cropData.npkOptimal?.nitrogen || DEFAULT_THRESHOLDS.nitrogen,
    phosphorus: cropData.npkOptimal?.phosphorus || DEFAULT_THRESHOLDS.phosphorus,
    potassium: cropData.npkOptimal?.potassium || DEFAULT_THRESHOLDS.potassium,
    ph: cropData.phOptimal || DEFAULT_THRESHOLDS.ph,
  };
}

export const SoilMoisture: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const { sensorData } = useFarmContext();
  const [thresholds, setThresholds] = useState<CropThresholds>(DEFAULT_THRESHOLDS);
  const [cropName, setCropName] = useState<string>("General");
  const [showAiStatus, setShowAiStatus] = useState(false);

  // Fetch crop from farm_settings on mount
  useEffect(() => {
    async function fetchCropSettings() {
      try {
        const farmId = localStorage.getItem("current_farm_id");
        if (!farmId) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/farm_settings?farmer_id=eq.${farmId}&select=crop`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.[0]?.crop) {
            const crop = data[0].crop;
            setCropName(crop);
            setThresholds(getCropThresholds(crop));
          }
        }
      } catch (e) {
        console.warn('[SoilMoisture] Failed to fetch crop settings:', e);
      }
    }

    fetchCropSettings();
  }, []);

  // Realistic agricultural moisture thresholds (dynamic based on crop)
  const getMoistureStatus = (moisture: number) => {
    const [min, max] = thresholds.moisture;
    if (moisture >= max + 10) return { label: t("soil.status.tooWet"), color: "text-blue-600", warning: "Risk of root rot", icon: Droplets };
    if (moisture >= max) return { label: t("soil.status.veryMoist"), color: "text-cyan-600", warning: "Monitor closely", icon: Info };
    if (moisture >= min) return { label: t("soil.status.healthy"), color: "text-green-600", warning: null, icon: CheckCircle2 };
    if (moisture >= min - 15) return { label: t("soil.status.moderate"), color: "text-amber-600", warning: "Consider watering", icon: AlertTriangle };
    if (moisture >= min - 30) return { label: t("soil.status.dry"), color: "text-orange-600", warning: "Needs water soon", icon: AlertTriangle };
    return { label: t("soil.status.critical"), color: "text-red-600", warning: "Urgent irrigation needed", icon: AlertOctagon };
  };

  // NPK status thresholds - now dynamic based on crop profile
  const getNutrientStatus = (value: number, type: 'N' | 'P' | 'K') => {
    const ranges = {
      N: thresholds.nitrogen,
      P: thresholds.phosphorus,
      K: thresholds.potassium
    };
    const [min, max] = ranges[type];

    if (value >= max * 1.2) return { status: t("soil.status.high"), color: "text-amber-600" };
    if (value >= min) return { status: t("soil.status.optimal"), color: "text-green-600" };
    if (value >= min * 0.7) return { status: t("soil.status.low"), color: "text-amber-600" };
    return { status: t("soil.status.deficient"), color: "text-red-600" };
  };

  // Soil pH status - dynamic based on crop
  const getPhStatus = (ph: number) => {
    const [min, max] = thresholds.ph;
    if (ph >= max + 1) return { label: t("soil.status.alkaline"), color: "text-purple-600", icon: AlertTriangle };
    if (ph >= max) return { label: t("soil.status.slightlyAlkaline"), color: "text-blue-600", icon: Info };
    if (ph >= min) return { label: t("soil.status.optimal"), color: "text-green-600", icon: CheckCircle2 };
    if (ph >= min - 0.5) return { label: t("soil.status.slightlyAcidic"), color: "text-amber-600", icon: Info };
    return { label: t("soil.status.acidic"), color: "text-red-600", icon: AlertOctagon };
  };

  // Compute all statuses from current sensor data
  const status = getMoistureStatus(sensorData?.soilMoisture ?? 0);
  const nStatus = getNutrientStatus(sensorData?.npk.nitrogen ?? 0, 'N');
  const pStatus = getNutrientStatus(sensorData?.npk.phosphorus ?? 0, 'P');
  const kStatus = getNutrientStatus(sensorData?.npk.potassium ?? 0, 'K');
  const phStatus = getPhStatus(sensorData?.pH ?? 7);

  // Display formatting (keep calculations on raw values, but show clean integers)
  const nitrogenDisplay = Math.round(sensorData?.npk.nitrogen ?? 0);
  const phosphorusDisplay = Math.round(sensorData?.npk.phosphorus ?? 0);
  const potassiumDisplay = Math.round(sensorData?.npk.potassium ?? 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/20 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/30 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("soil.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("soil.subtitle")}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-200/50 dark:bg-amber-700/30 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Left Column: Enhanced Gauge */}
        <div className="flex flex-col items-center justify-center">
          <EnhancedGauge
            value={sensorData?.soilMoisture ?? 0}
            max={100}
            min={0}
            label={t("soil.moisture")}
            unit="%"
            size="lg" // Increased size for better balance
            color="emerald"
          />
          <div className={`mt-4 px-6 py-2 rounded-full bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-700/50 ${status.color} font-semibold text-base backdrop-blur-sm transition-all duration-300 hover:scale-105 flex items-center gap-2`}>
            <status.icon className="w-5 h-5" />
            {status.label}
          </div>
        </div>

        {/* Right Column: NPK Indicators */}
        <div className="flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-amber-100/60 to-yellow-100/60 dark:from-amber-800/30 dark:to-yellow-800/30 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-amber-200/40 dark:border-amber-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/15 dark:bg-green-500/25">
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">N</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{nitrogenDisplay}</div>
                  <div className="text-xs text-muted-foreground">{t("soil.nitrogen")}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold px-3 py-1 rounded-full bg-background/50 border border-border/50 ${nStatus.color}`}>{nStatus.status}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-100/60 to-orange-100/60 dark:from-amber-800/30 dark:to-orange-800/30 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-amber-200/40 dark:border-amber-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 dark:bg-amber-500/30">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">P</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{phosphorusDisplay}</div>
                  <div className="text-xs text-muted-foreground">{t("soil.phosphorus")}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold px-3 py-1 rounded-full bg-background/50 border border-border/50 ${pStatus.color}`}>{pStatus.status}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-100/60 to-red-100/40 dark:from-orange-800/30 dark:to-red-800/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-orange-200/40 dark:border-orange-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/20 dark:bg-orange-500/30">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">K</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{potassiumDisplay}</div>
                  <div className="text-xs text-muted-foreground">{t("soil.potassium")}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold px-3 py-1 rounded-full bg-background/50 border border-border/50 ${kStatus.color}`}>{kStatus.status}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200/30 dark:border-amber-700/30">
        <div className="flex items-center gap-3 p-3 bg-amber-100/40 dark:bg-amber-800/20 backdrop-blur-sm rounded-xl border border-amber-200/30 dark:border-amber-700/30 hover:bg-amber-100/60 dark:hover:bg-amber-800/30 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 dark:bg-blue-500/25 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">pH</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("soil.phLevel")}</div>
            <div className="text-xl font-bold text-foreground">
              {sensorData?.pH.toFixed(1) ?? 0}
            </div>
            <div className={`text-xs font-semibold ${phStatus.color} flex items-center gap-1`}>
              <phStatus.icon className="w-3 h-3" />
              {phStatus.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-100/40 dark:bg-amber-800/20 backdrop-blur-sm rounded-xl border border-amber-200/30 dark:border-amber-700/30 hover:bg-amber-100/60 dark:hover:bg-amber-800/30 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-purple-500/15 dark:bg-purple-500/25 flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">EC</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("soil.conductivity")}</div>
            <div className="text-xl font-bold text-foreground">
              {sensorData?.ec.toFixed(2) ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Lottie Animated Farm Scene (replaces RealisticFarmView) */}
      <div className="mt-6 pt-4 border-t border-amber-200/30 dark:border-amber-700/30">
        <LottieFarmScene
          cropName={cropName}
          sensorData={{
            soilMoisture: sensorData?.soilMoisture ?? 50,
            temperature: sensorData?.temperature ?? 25,
            npk: {
              nitrogen: sensorData?.npk.nitrogen ?? 50,
              potassium: sensorData?.npk.potassium ?? 50
            }
          }}
          thresholds={{ moisture: thresholds.moisture }}
          onAiStatusClick={() => setShowAiStatus(true)}
        />
      </div>

      {/* AI System Status Chart Modal */}
      <SystemStatusChart isOpen={showAiStatus} onClose={() => setShowAiStatus(false)} />
    </div>
  );
};
