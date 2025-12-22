import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import CONFIG from "../config";
import {
  SensorData,
  SystemStatus,
  SensorService,
} from "../services/SensorService";
import { WeatherData, WeatherService } from "../services/WeatherService";
import {
  BlockchainRecord,
  BlockchainService,
} from "../services/BlockchainService";
import { useAuth } from "./AuthContext";

export interface ActionLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  type: "irrigation" | "fertilization" | "info";
}

interface FarmContextType {
  // Sensor Data
  sensorData: SensorData | null;
  systemStatus: SystemStatus | null;
  loading: boolean;
  error: string | null;

  // Weather Data
  weatherData: WeatherData | null;

  // Blockchain Records
  blockchainRecords: BlockchainRecord[];

  // Action Log
  actionLog: ActionLogEntry[];

  // Methods
  refreshSensorData: () => Promise<void>;
  refreshWeather: () => Promise<void>;
  refreshBlockchain: () => Promise<void>;
  setAutonomous: (enabled: boolean) => Promise<void>;
  triggerWaterPump: () => Promise<void>;
  triggerFertilizer: () => Promise<void>;
  addActionLog: (action: ActionLogEntry) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

interface FarmContextProviderProps {
  children: React.ReactNode;
}

export const FarmContextProvider: React.FC<FarmContextProviderProps> = ({
  children,
}) => {
  // Get auth context to scope data to authenticated user
  // Wrapped in try-catch to handle HMR edge cases
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Auth context not ready yet (e.g., during HMR)
    console.warn('[FarmContext] Auth context not available yet');
  }

  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [blockchainRecords, setBlockchainRecords] = useState<
    BlockchainRecord[]
  >([]);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([
    {
      id: "log_001",
      timestamp: new Date(Date.now() - 7200000),
      action: "Irrigation Cycle",
      description: "Irrigation triggered – 15L dispensed to sector A",
      type: "irrigation",
    },
    {
      id: "log_002",
      timestamp: new Date(Date.now() - 10800000),
      action: "Fertilization Skipped",
      description: "Fertilization skipped – rain expected within 24h",
      type: "info",
    },
    {
      id: "log_003",
      timestamp: new Date(Date.now() - 14400000),
      action: "Fertilization Applied",
      description: "NPK boost applied – 2.5kg phosphorus blend",
      type: "fertilization",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUuid = useCallback(
    (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
    [],
  );

  const ensureCurrentFarmId = useCallback(async () => {
    if (!user?.id) return;

    const existing = localStorage.getItem("current_farm_id");
    if (existing && isUuid(existing)) {
      // Validate that this farm actually has readings; otherwise, pick another farm.
      try {
        const check = await fetch(
          `${CONFIG.API_BASE_URL}/sensors/latest?farmId=${encodeURIComponent(existing)}`,
        );
        if (check.ok) {
          const payload = await check.json();
          if (payload?.sensorData) return;
        }
      } catch {
        // ignore and continue to re-pick
      }
    }

    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/farms?farmerId=${encodeURIComponent(user.id)}`,
      );
      if (!response.ok) return;

      const data = await response.json();

      const farms: Array<{ id: string }> = Array.isArray(data?.farms)
        ? data.farms
        : [];

      // Prefer a farm that already has sensor readings
      for (const farm of farms) {
        if (!farm?.id || !isUuid(farm.id)) continue;
        try {
          const r = await fetch(
            `${CONFIG.API_BASE_URL}/sensors/latest?farmId=${encodeURIComponent(farm.id)}`,
          );
          if (!r.ok) continue;
          const payload = await r.json();
          if (payload?.sensorData) {
            localStorage.setItem("current_farm_id", farm.id);
            return;
          }
        } catch {
          // ignore and try next
        }
      }

      // Fallback: just pick the newest farm (server returns created_at desc)
      const firstFarmId = farms?.[0]?.id;
      if (firstFarmId && isUuid(firstFarmId)) {
        localStorage.setItem("current_farm_id", firstFarmId);
      }
    } catch (e) {
      // If this fails, SensorService will gracefully fall back to mock data.
    }
  }, [isUuid, user?.id]);

  // When a user logs in / session restores, pick a valid farm UUID
  useEffect(() => {
    ensureCurrentFarmId();
  }, [ensureCurrentFarmId]);

  const refreshSensorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await ensureCurrentFarmId();
      const [sensor, status] = await Promise.all([
        SensorService.getSensorData(),
        SensorService.getSystemStatus(),
      ]);
      setSensorData(sensor);
      setSystemStatus(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sensor data",
      );
    } finally {
      setLoading(false);
    }
  }, [ensureCurrentFarmId]);

  const refreshWeather = useCallback(async () => {
    try {
      const weather = await WeatherService.getCurrentWeather();
      setWeatherData(weather);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load weather data",
      );
    }
  }, []);

  const refreshBlockchain = useCallback(async () => {
    try {
      const records = await BlockchainService.getAuditTrail();
      setBlockchainRecords(records);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load blockchain records",
      );
    }
  }, []);

  const setAutonomous = useCallback(async (enabled: boolean) => {
    try {
      setLoading(true);
      await SensorService.setAutonomous(enabled);
      setSystemStatus((prev) =>
        prev ? { ...prev, isAutonomous: enabled } : null,
      );
      addActionLog({
        id: `log_${Date.now()}`,
        timestamp: new Date(),
        action: "System Mode Changed",
        description: `System switched to ${enabled ? "Autonomous" : "Manual"} mode`,
        type: "info",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change mode");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerWaterPump = useCallback(async () => {
    try {
      setLoading(true);
      const success = await SensorService.triggerWaterPump();
      if (success) {
        addActionLog({
          id: `log_${Date.now()}`,
          timestamp: new Date(),
          action: "Water Pump",
          description: "Manual irrigation triggered – 15L dispensed",
          type: "irrigation",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger pump");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerFertilizer = useCallback(async () => {
    try {
      setLoading(true);
      const success = await SensorService.triggerFertilizer();
      if (success) {
        addActionLog({
          id: `log_${Date.now()}`,
          timestamp: new Date(),
          action: "Fertilizer",
          description:
            "Manual fertilization triggered – 2kg NPK blend dispensed",
          type: "fertilization",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger fertilizer",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addActionLog = useCallback((entry: ActionLogEntry) => {
    setActionLog((prev) => [entry, ...prev]);
  }, []);

  const value: FarmContextType = {
    sensorData,
    systemStatus,
    weatherData,
    blockchainRecords,
    actionLog,
    loading,
    error,
    refreshSensorData,
    refreshWeather,
    refreshBlockchain,
    setAutonomous,
    triggerWaterPump,
    triggerFertilizer,
    addActionLog,
  };

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

export const useFarmContext = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarmContext must be used within FarmContextProvider");
  }
  return context;
};
