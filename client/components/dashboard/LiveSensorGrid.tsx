/**
 * LiveSensorGrid - Real-time IoT sensor data display
 * Shows live data from ESP32 hardware via WebSocket
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Thermometer, Wind, Leaf, Wifi, WifiOff, Activity } from "lucide-react";
import { IoTService, LiveSensorData, SystemStatus } from "../../services/IoTService";
import { useAuth } from "../../context/AuthContext";

interface SensorCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    unit: string;
    color: string;
    gradient: string;
    isLive: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({
    icon,
    label,
    value,
    unit,
    color,
    gradient,
    isLive,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg border border-white/20 backdrop-blur-sm`}
        >
            {/* Live indicator */}
            {isLive && (
                <div className="absolute top-3 right-3">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
                    />
                </div>
            )}

            {/* Icon */}
            <div className={`inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-md mb-4 ${color}`}>
                {icon}
            </div>

            {/* Label */}
            <h3 className="text-sm font-medium text-white/80 mb-2">{label}</h3>

            {/* Value with smooth animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={value.toString()}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-baseline gap-2"
                >
                    <span className="text-4xl font-bold text-white">
                        {typeof value === "number" ? value.toFixed(1) : value}
                    </span>
                    <span className="text-lg font-medium text-white/70">{unit}</span>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export const LiveSensorGrid: React.FC = () => {
    const { user } = useAuth();
    const [sensorData, setSensorData] = useState<LiveSensorData | null>(null);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        isOnline: false,
        lastUpdate: new Date(),
    });

    useEffect(() => {
        // DEMO HACK: Force the specific UUID that matches the backend mapping for "farm_001"
        // This ensures data flows even if the user logged in with a different ID
        const DEMO_FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8";
        const farmId = DEMO_FARM_ID;

        console.log("[LiveSensorGrid] 🔌 Connecting to IoT service for farm:", farmId);

        // Connect to WebSocket
        IoTService.connect(farmId);

        // Subscribe to sensor data updates
        const unsubscribeData = IoTService.onMessage((data) => {
            console.log("[LiveSensorGrid] Received sensor data:", data);
            setSensorData(data);
        });

        // Subscribe to status updates
        const unsubscribeStatus = IoTService.onStatusChange((status) => {
            console.log("[LiveSensorGrid] Status changed:", status);
            setSystemStatus(status);
        });

        // Subscribe to irrigation events
        const unsubscribeIrrigation = IoTService.onIrrigationEvent((event) => {
            console.log("[LiveSensorGrid] Irrigation triggered:", event);
            // You can show a toast notification here
        });

        // Cleanup on unmount
        return () => {
            unsubscribeData();
            unsubscribeStatus();
            unsubscribeIrrigation();
            IoTService.disconnect();
        };
    }, [user]);

    // Calculate NPK percentage (0-1023 -> 0-100%)
    const npkPercentage = sensorData ? ((sensorData.npk / 1023) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6">
            {/* System Status Badge */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" />
                    Live Sensor Monitor
                </h2>

                <motion.div
                    animate={{ scale: systemStatus.isOnline ? [1, 1.05, 1] : 1 }}
                    transition={{ repeat: systemStatus.isOnline ? Infinity : 0, duration: 2 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${systemStatus.isOnline
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-red-500/20 border border-red-500/30"
                        }`}
                >
                    {systemStatus.isOnline ? (
                        <>
                            <Wifi className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-semibold text-green-400">Live</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-semibold text-red-400">Offline</span>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Sensor Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Soil Moisture */}
                <SensorCard
                    icon={<Droplets className="w-6 h-6" />}
                    label="Soil Moisture"
                    value={sensorData?.moisture ?? 0}
                    unit="%"
                    color="text-blue-400"
                    gradient="from-blue-500/90 to-blue-600/90"
                    isLive={systemStatus.isOnline}
                />

                {/* Temperature */}
                <SensorCard
                    icon={<Thermometer className="w-6 h-6" />}
                    label="Temperature"
                    value={sensorData?.temp ?? 0}
                    unit="°C"
                    color="text-orange-400"
                    gradient="from-orange-500/90 to-red-500/90"
                    isLive={systemStatus.isOnline}
                />

                {/* Humidity */}
                <SensorCard
                    icon={<Wind className="w-6 h-6" />}
                    label="Humidity"
                    value={sensorData?.humidity ?? 0}
                    unit="%"
                    color="text-cyan-400"
                    gradient="from-cyan-500/90 to-teal-500/90"
                    isLive={systemStatus.isOnline}
                />

                {/* NPK (Nutrient Level) */}
                <SensorCard
                    icon={<Leaf className="w-6 h-6" />}
                    label="Nutrient Level"
                    value={npkPercentage}
                    unit="%"
                    color="text-green-400"
                    gradient="from-green-500/90 to-emerald-600/90"
                    isLive={systemStatus.isOnline}
                />
            </div>

            {/* Last Update Info */}
            {sensorData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-muted-foreground"
                >
                    Last updated:{" "}
                    {new Date(sensorData.timestamp || systemStatus.lastUpdate).toLocaleTimeString()}
                </motion.div>
            )}

            {/* No Data Message */}
            {!sensorData && !systemStatus.isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 px-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                >
                    <WifiOff className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                        Waiting for sensor data...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Make sure your ESP32 device is connected and publishing to MQTT
                    </p>
                </motion.div>
            )}
        </div>
    );
};
