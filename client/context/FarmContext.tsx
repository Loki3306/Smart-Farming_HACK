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
import { sendNotification } from "../services/NotificationService";
import {
  getStoredAlerts,
  storeAlerts,
  type SensorAlert,
} from "../hooks/useSensorAlerts";
import { useTranslation } from "react-i18next";
import { getLocalizedDescription, getLocalizedAction } from "../lib/logTranslator";

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
  const { t } = useTranslation("dashboard");
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
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>(
    CONFIG.USE_MOCK_DATA
      ? [
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
      ]
      : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionLogsInitializedRef = React.useRef(false);
  const lastSeenActionLogTsRef = React.useRef<number>(0);
  const lastActionLogFetchAtRef = React.useRef<number>(0);

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

      // Fetch action logs less frequently than sensor readings to reduce load.
      const now = Date.now();
      if (now - lastActionLogFetchAtRef.current >= 15000) {
        lastActionLogFetchAtRef.current = now;
        const logs = await SensorService.getActionLogs(50);

        const mapped: ActionLogEntry[] = logs
          .map((log) => {
            const type: ActionLogEntry["type"] =
              log.action_type === "irrigation" ||
                log.action_type === "fertilization" ||
                log.action_type === "info"
                ? log.action_type
                : "info";

            const baseAction =
              type === "irrigation"
                ? "Irrigation"
                : type === "fertilization"
                  ? "Fertilization"
                  : "System";

            const desc = String(log.description || "");
            const isAutonomous = /\bautonomous\b/i.test(desc);
            const isManual = /\bmanual(ly)?\b/i.test(desc);
            const originLabel = isAutonomous ? "Autonomous" : isManual ? "Manual" : "";

            const action = originLabel ? `${originLabel} ${baseAction}` : baseAction;

            return {
              id: log.id,
              timestamp: new Date(log.timestamp),
              action,
              description: log.description,
              type,
            };
          })
          .filter((e) => !Number.isNaN(e.timestamp.getTime()));

        // On first successful load, don't spam notifications for historical rows.
        if (!actionLogsInitializedRef.current) {
          actionLogsInitializedRef.current = true;
          setActionLog(mapped);
          lastSeenActionLogTsRef.current = mapped?.[0]
            ? mapped[0].timestamp.getTime()
            : 0;
        } else {
          // Notify for newly observed actions
          const lastSeen = lastSeenActionLogTsRef.current;
          const newEntries = mapped
            .filter((e) => e.timestamp.getTime() > lastSeen)
            .slice(0, 3);

          if (newEntries.length > 0) {
            // Update last seen to the newest entry
            lastSeenActionLogTsRef.current = mapped[0].timestamp.getTime();

            try {
              const existing = getStoredAlerts();
              const appended: SensorAlert[] = [...existing];

              for (const entry of newEntries.reverse()) {
                const alertType: SensorAlert["type"] =
                  entry.type === "irrigation" ? "irrigation" : entry.type === "fertilization" ? "crop" : "alert";

                const title =
                  entry.type === "irrigation"
                    ? "Irrigation action"
                    : entry.type === "fertilization"
                      ? "Fertilization action"
                      : "System update";

                // Localize content for notification
                const localizedTitle = getLocalizedAction(title, t);
                const localizedMessage = getLocalizedDescription(entry.description, t);

                const alert: SensorAlert = {
                  id: `action_${entry.id}`,
                  type: alertType,
                  title: localizedTitle,
                  message: localizedMessage,
                  timestamp: new Date(entry.timestamp),
                  priority:
                    entry.type === "irrigation" ? "medium" : entry.type === "fertilization" ? "low" : "low",
                  read: false,
                };

                appended.push(alert);
                storeAlerts(appended);

                // Fire a browser notification as well
                void sendNotification(localizedTitle, localizedMessage, {
                  type: alertType,
                  enablePush: true,
                  enableSound: true,
                  enableVibration: entry.type === "irrigation",
                });
              }
            } catch (e) {
              console.warn("[FarmContext] Failed to generate action notifications", e);
            }
          }

          setActionLog(mapped);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sensor data",
      );
    } finally {
      setLoading(false);
    }
  }, [ensureCurrentFarmId, t]); // Added t as dependency

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
