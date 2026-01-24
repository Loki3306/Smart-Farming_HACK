import React, { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
    LineChart,
    Line,
    Brush
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Calendar, Activity, Droplets, Thermometer, Sprout, Filter, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarmContext } from "../context/FarmContext";

// Types for historical data
interface HistoryPoint {
    timestamp: string;
    soilMoisture: number;
    temperature: number;
    humidity: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
}

export const IoTAnalyticsCard: React.FC = () => {
    const { t } = useTranslation("dashboard");
    const { theme } = useTheme();
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
    const [activeTab, setActiveTab] = useState<"soil" | "env" | "nutrients">("soil");
    const [loading, setLoading] = useState(false);

    // Generate realistic demo data
    const generateDemoData = (range: "24h" | "7d" | "30d") => {
        const points = range === "24h" ? 24 : range === "7d" ? 7 : 30;
        const now = new Date();
        const demoData: HistoryPoint[] = [];

        for (let i = points; i >= 0; i--) {
            const time = new Date(now);
            if (range === "24h") time.setHours(time.getHours() - i);
            else if (range === "7d") time.setDate(time.getDate() - i);
            else time.setDate(time.getDate() - i);

            // Create realistic diurnal cycles
            const hour = time.getHours();
            const isDay = hour > 6 && hour < 18;

            // Random variation with trends
            demoData.push({
                timestamp: time.toISOString(),
                soilMoisture: 65 + Math.sin(i * 0.5) * 10 + (Math.random() * 5),
                temperature: 25 + (isDay ? 5 : -5) + (Math.random() * 2),
                humidity: 60 + (isDay ? -10 : 10) + (Math.random() * 5),
                nitrogen: 140 + (Math.random() * 10),
                phosphorus: 45 + (Math.random() * 5),
                potassium: 200 + (Math.random() * 15),
                ph: 6.5 + (Math.random() * 0.4 - 0.2)
            });
        }
        return demoData;
    };

    // Fetch real historical data from API
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const farmId = localStorage.getItem('current_farm_id');
                // Always try to fetch real data first
                if (farmId) {
                    let limit = 100;
                    if (timeRange === "24h") limit = 288;
                    if (timeRange === "7d") limit = 2016;
                    if (timeRange === "30d") limit = 8000;

                    const response = await fetch(`/api/sensors/history?farmId=${farmId}&limit=${limit}`);
                    if (response.ok) {
                        const result = await response.json();
                        if (result.history && result.history.length > 5) {
                            const mappedData = (result.history || []).map((reading: any) => ({
                                timestamp: reading.timestamp,
                                soilMoisture: reading.soil_moisture,
                                temperature: reading.temperature,
                                humidity: reading.humidity,
                                nitrogen: reading.nitrogen,
                                phosphorus: reading.phosphorus,
                                potassium: reading.potassium,
                                ph: reading.ph,
                                battery: reading.battery_level,
                                signal: reading.signal_strength
                            })).reverse();
                            setData(mappedData);
                            setLoading(false);
                            return; // Real data found, exit
                        }
                    }
                }

                // Fallback to Demo Data
                console.log("Using demo data for analytics visualization");
                setData(generateDemoData(timeRange));

            } catch (error) {
                console.error("Error fetching history:", error);
                setData(generateDemoData(timeRange));
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Refresh every minute
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [timeRange]);

    const isDark = theme === "dark";

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-semibold mb-2 text-foreground">
                        {new Date(label).toLocaleString([], {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground capitalize">
                                {entry.name}:
                            </span>
                            <span className="font-mono font-medium text-foreground">
                                {Number(entry.value).toFixed(1)} {entry.unit}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const formatXAxis = (tickItem: string) => {
        const date = new Date(tickItem);
        if (timeRange === "24h") return date.toLocaleTimeString([], { hour: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <Card className="p-6 overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/20 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Activity className="w-5 h-5 text-primary" />
                        IoT Analytics
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real-time sensor data trends and historical analysis
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50">
                    {(["24h", "7d", "30d"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === range
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                                }`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-border/50 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveTab("soil")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "soil"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Droplets className="w-4 h-4" />
                    Soil Moisture
                </button>
                <button
                    onClick={() => setActiveTab("env")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "env"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Thermometer className="w-4 h-4" />
                    Environment
                </button>
                <button
                    onClick={() => setActiveTab("nutrients")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "nutrients"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Sprout className="w-4 h-4" />
                    Nutrients (NPK)
                </button>
            </div>

            {/* Charts Area */}
            <div className="h-[350px] w-full min-h-[300px]">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-xl animate-pulse">
                        <Activity className="w-8 h-8 text-muted-foreground animate-bounce" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {activeTab === "soil" ? (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#e5e5e5"} vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={formatXAxis}
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    unit="%"
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Min', fill: '#ef4444', fontSize: 10 }} />
                                <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fill: '#F59E0B', fontSize: 10 }} />
                                <Area
                                    type="monotone"
                                    dataKey="soilMoisture"
                                    name="Moisture"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorMoisture)"
                                    unit="%"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        ) : activeTab === "env" ? (
                            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#e5e5e5"} vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={formatXAxis}
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    unit="°C"
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    unit="%"
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="temperature"
                                    name="Temperature"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    unit="°C"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="humidity"
                                    name="Humidity"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    unit="%"
                                />
                            </LineChart>
                        ) : (
                            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#e5e5e5"} vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={formatXAxis}
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke={isDark ? "#888" : "#666"}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Line type="monotone" dataKey="nitrogen" name="Nitrogen" stroke="#22c55e" strokeWidth={2} dot={false} unit="mg/kg" />
                                <Line type="monotone" dataKey="phosphorus" name="Phosphorus" stroke="#eab308" strokeWidth={2} dot={false} unit="mg/kg" />
                                <Line type="monotone" dataKey="potassium" name="Potassium" stroke="#ef4444" strokeWidth={2} dot={false} unit="mg/kg" />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            {/* Footer Info */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    <span>Showing {data.length} data points</span>
                </div>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Download className="w-3 h-3" />
                    Export CSV
                </button>
            </div>
        </Card>
    );
};
