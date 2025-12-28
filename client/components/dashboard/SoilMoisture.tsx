import React, { useState, useEffect } from "react";
import { Gauge } from "../ui/Gauge";
import { useFarmContext } from "../../context/FarmContext";
import cropProfilesData from "../../../shared/crop_profiles.json";
import RealisticFarmView from "./RealisticFarmView";
import { SystemStatusChart } from "./SystemStatusChart";

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
    if (moisture >= max + 10) return { label: "Too Wet ⚠️", color: "text-blue-600", warning: "Risk of root rot" };
    if (moisture >= max) return { label: "Very Moist", color: "text-cyan-600", warning: "Monitor closely" };
    if (moisture >= min) return { label: "Healthy ✓", color: "text-green-600", warning: null };
    if (moisture >= min - 15) return { label: "Moderate", color: "text-amber-600", warning: "Consider watering" };
    if (moisture >= min - 30) return { label: "Dry", color: "text-orange-600", warning: "Needs water soon" };
    return { label: "Critical! 🚨", color: "text-red-600", warning: "Urgent irrigation needed" };
  };

  // NPK status thresholds - now dynamic based on crop profile
  const getNutrientStatus = (value: number, type: 'N' | 'P' | 'K') => {
    const ranges = {
      N: thresholds.nitrogen,
      P: thresholds.phosphorus,
      K: thresholds.potassium
    };
    const [min, max] = ranges[type];

    if (value >= max * 1.2) return { status: "High", color: "text-amber-600" };
    if (value >= min) return { status: "Optimal", color: "text-green-600" };
    if (value >= min * 0.7) return { status: "Low", color: "text-amber-600" };
    return { status: "Deficient", color: "text-red-600" };
  };

  // Soil pH status - dynamic based on crop
  const getPhStatus = (ph: number) => {
    const [min, max] = thresholds.ph;
    if (ph >= max + 1) return { label: "Alkaline ⚠️", color: "text-purple-600" };
    if (ph >= max) return { label: "Slightly Alkaline", color: "text-blue-600" };
    if (ph >= min) return { label: "Optimal ✓", color: "text-green-600" };
    if (ph >= min - 0.5) return { label: "Slightly Acidic", color: "text-amber-600" };
    return { label: "Acidic ⚠️", color: "text-red-600" };
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
          <h3 className="text-lg font-semibold text-foreground">Soil Condition</h3>
          <p className="text-sm text-muted-foreground">Real-time sensor readings</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-200/50 dark:bg-amber-700/30 flex items-center justify-center">
          <span className="text-lg">🌱</span>
        </div>
      </div>

      {/* Gauge with Status */}
      <div className="flex flex-col items-center mb-6">
        <Gauge
          value={sensorData?.soilMoisture ?? 0}
          max={100}
          min={0}
          label="Soil Moisture"
          unit="%"
          size="md"
          color="emerald"
        />
        <div className={`mt-3 px-4 py-1.5 rounded-full bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-700/50 ${status.color} font-semibold text-sm backdrop-blur-sm transition-all duration-300 hover:scale-105`}>
          {status.label}
        </div>
      </div>

      {/* NPK Indicators */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-100/60 to-yellow-100/60 dark:from-amber-800/30 dark:to-yellow-800/30 backdrop-blur-sm rounded-xl p-4 text-center border border-amber-200/40 dark:border-amber-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/15 dark:bg-green-500/25 mb-2">
            <span className="text-green-600 dark:text-green-400 font-bold">N</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {nitrogenDisplay}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Nitrogen</div>
          <div className={`text-xs font-semibold ${nStatus.color}`}>{nStatus.status}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-100/60 to-orange-100/60 dark:from-amber-800/30 dark:to-orange-800/30 backdrop-blur-sm rounded-xl p-4 text-center border border-amber-200/40 dark:border-amber-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 dark:bg-amber-500/30 mb-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold">P</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {phosphorusDisplay}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Phosphorus</div>
          <div className={`text-xs font-semibold ${pStatus.color}`}>{pStatus.status}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-100/60 to-red-100/40 dark:from-orange-800/30 dark:to-red-800/20 backdrop-blur-sm rounded-xl p-4 text-center border border-orange-200/40 dark:border-orange-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/20 dark:bg-orange-500/30 mb-2">
            <span className="text-orange-600 dark:text-orange-400 font-bold">K</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {potassiumDisplay}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Potassium</div>
          <div className={`text-xs font-semibold ${kStatus.color}`}>{kStatus.status}</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200/30 dark:border-amber-700/30">
        <div className="flex items-center gap-3 p-3 bg-amber-100/40 dark:bg-amber-800/20 backdrop-blur-sm rounded-xl border border-amber-200/30 dark:border-amber-700/30 hover:bg-amber-100/60 dark:hover:bg-amber-800/30 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 dark:bg-blue-500/25 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">pH</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">pH Level</div>
            <div className="text-xl font-bold text-foreground">
              {sensorData?.pH.toFixed(1) ?? 0}
            </div>
            <div className={`text-xs font-semibold ${phStatus.color}`}>{phStatus.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-100/40 dark:bg-amber-800/20 backdrop-blur-sm rounded-xl border border-amber-200/30 dark:border-amber-700/30 hover:bg-amber-100/60 dark:hover:bg-amber-800/30 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-purple-500/15 dark:bg-purple-500/25 flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">EC</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Conductivity</div>
            <div className="text-xl font-bold text-foreground">
              {sensorData?.ec.toFixed(2) ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Farm Visualization */}
      <div className="mt-6 pt-4 border-t border-amber-200/30 dark:border-amber-700/30">
        <RealisticFarmView
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
