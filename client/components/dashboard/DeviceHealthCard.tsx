import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Battery, BatteryCharging, BatteryLow, BatteryMedium, Signal, Wifi, WifiOff, RefreshCw, AlertTriangle, Smartphone } from "lucide-react";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IoTDevice {
    id: string;
    name: string;
    type: string;
    battery: number;
    signal: number; // dBm
    lastSync: Date;
    status: "online" | "offline" | "maintenance";
    isCharging?: boolean;
}

export const DeviceHealthCard: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [devices, setDevices] = useState<IoTDevice[]>([]);

    // Generate realistic demo devices
    const generateDemoDevices = (): IoTDevice[] => {
        return [
            {
                id: "main-station",
                name: "Main Sensor Station",
                type: "Multi-Sensor Hub (ESP32)",
                battery: 92,
                signal: -58,
                lastSync: new Date(),
                status: "online",
                isCharging: true
            },
            {
                id: "pump-controller",
                name: "Irrigation Pump",
                type: "Actuator Controller",
                battery: 100, // Hardwired usually
                signal: -65,
                lastSync: new Date(),
                status: "online",
                isCharging: false
            },
            {
                id: "drone-dock",
                name: "Drone Docking Station",
                type: "Survey Drone Hub",
                battery: 45,
                signal: -72,
                lastSync: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
                status: "maintenance",
                isCharging: true
            },
            {
                id: "soil-probe-remote",
                name: "Remote Soil Compass",
                type: "Moisture Sensor",
                battery: 15,
                signal: -85,
                lastSync: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
                status: "offline",
                isCharging: false
            }
        ];
    };

    // Fetch real device status from latest sensor data
    useEffect(() => {
        const fetchDeviceStatus = async () => {
            try {
                const farmId = localStorage.getItem('current_farm_id');
                // Try fetching real data first
                if (farmId) {
                    const response = await fetch(`/api/sensors/latest?farmId=${farmId}`);
                    if (response.ok) {
                        const result = await response.json();
                        const sensor = result.sensorData;

                        if (sensor) {
                            // Real data processing...
                            const lastSyncTime = new Date(sensor.timestamp);
                            const isOnline = (Date.now() - lastSyncTime.getTime()) < 300000;

                            const batteryLevel = sensor.battery_level ?? 100;
                            const signalStrength = sensor.signal_strength ?? -60;

                            const realDevices: IoTDevice[] = [
                                {
                                    id: "main-station",
                                    name: "Main Sensor Station",
                                    type: "Multi-Sensor Hub",
                                    battery: batteryLevel,
                                    signal: signalStrength,
                                    lastSync: lastSyncTime,
                                    status: isOnline ? "online" : "offline",
                                    isCharging: batteryLevel < 100 && new Date().getHours() > 6 && new Date().getHours() < 18
                                },
                                {
                                    id: "soil-probe-1",
                                    name: "Soil Probe (Primary)",
                                    type: "Soil Moisture",
                                    battery: batteryLevel,
                                    signal: signalStrength,
                                    lastSync: lastSyncTime,
                                    status: isOnline ? "online" : "offline"
                                }
                            ];
                            setDevices(realDevices);
                            return; // Exit if real data found
                        }
                    }
                }

                // Fallback to Demo Devices
                console.log("Using demo devices for visualization");
                setDevices(generateDemoDevices());

            } catch (error) {
                console.error("Error fetching device status:", error);
                setDevices(generateDemoDevices());
            }
        };

        fetchDeviceStatus();
        const interval = setInterval(fetchDeviceStatus, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const getBatteryColor = (level: number) => {
        if (level > 60) return "#22c55e"; // Green
        if (level > 25) return "#eab308"; // Yellow
        return "#ef4444"; // Red
    };

    const getBatteryIcon = (level: number, isCharging?: boolean) => {
        if (isCharging) return <BatteryCharging className="w-4 h-4 text-green-500 animate-pulse" />;
        if (level > 60) return <Battery className="w-4 h-4 text-green-500" />;
        if (level > 25) return <BatteryMedium className="w-4 h-4 text-yellow-500" />;
        return <BatteryLow className="w-4 h-4 text-red-500 animate-pulse" />;
    };

    const getSignalIcon = (dbm: number) => {
        if (dbm > -50) return <Signal className="w-4 h-4 text-green-500" />;
        if (dbm > -70) return <Wifi className="w-4 h-4 text-yellow-500" />;
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    };

    return (
        <Card className="p-6 overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/20 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/30 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Smartphone className="w-5 h-5 text-primary" />
                        Device Health
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Battery levels & connectivity status
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {devices.filter(d => d.status === "online").length} Online
                </div>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {devices.map((device) => (
                    <div
                        key={device.id}
                        className={`p-4 rounded-xl border transition-all duration-300 ${device.battery < 20
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-card/50 border-border/50 hover:bg-muted/50"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            {/* Battery Circle */}
                            <div className="w-12 h-12 flex-shrink-0 relative">
                                <CircularProgressbarWithChildren
                                    value={device.battery}
                                    styles={buildStyles({
                                        pathColor: getBatteryColor(device.battery),
                                        trailColor: isDark ? "#333" : "#e5e5e5",
                                        strokeLinecap: "round",
                                        pathTransitionDuration: 0.5,
                                    })}
                                >
                                    <div className="text-[10px] font-bold text-foreground">
                                        {Math.round(device.battery)}%
                                    </div>
                                </CircularProgressbarWithChildren>
                                {device.isCharging && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                                        ⚡
                                    </div>
                                )}
                            </div>

                            {/* Device Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm truncate pr-2 text-foreground">
                                        {device.name}
                                    </h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${device.status === "online"
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                        }`}>
                                        {device.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="truncate">{device.type}</span>
                                    <div className="flex items-center gap-3">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        {getSignalIcon(device.signal)}
                                                        <span>{device.signal}dBm</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Signal Strength: {device.signal > -50 ? "Excellent" : device.signal > -70 ? "Good" : "Poor"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <span className="flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            {Math.floor((Date.now() - device.lastSync.getTime()) / 60000)}m ago
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Low Battery Warning */}
                        {device.battery < 20 && (
                            <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Critical Battery Level - Replace Soon
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-border/50 text-center">
                <button className="text-xs font-medium text-primary hover:underline">
                    Manage All Devices
                </button>
            </div>
        </Card>
    );
};
