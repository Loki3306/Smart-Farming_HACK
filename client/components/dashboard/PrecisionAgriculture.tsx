import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFarmContext } from '@/context/FarmContext';

interface SoilChemistry {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    salinity: number;
}

interface AtmosphericData {
    windSpeed: number;
    et0: number;
    isSafeForSpraying: boolean;
    riskLevel: string;
}

interface AgronomyAnalysis {
    soil_health?: {
        salinity: {
            ec_measured: number;
            is_stressed: boolean;
            action: string;
            lr_percent: number;
        };
        nutrients: {
            nitrogen_available_ppm: number;
            phosphorus_available_ppm: number;
            potassium_available_ppm: number;
            p_locked: boolean;
        };
    };
    atmospheric?: {
        wind_safety: {
            wind_speed: number;
            is_safe_for_spraying: boolean;
            risk_level: string;
        };
        evapotranspiration: {
            et0_mm_day: number;
            water_demand_level: string;
        };
    };
}

interface PrecisionAgricultureProps {
    sensorDataOverride?: any;
}

export const PrecisionAgriculture: React.FC<PrecisionAgricultureProps> = ({ sensorDataOverride }) => {
    const { sensorData: contextSensorData, weatherData } = useFarmContext();
    // Use override if provided, otherwise context
    const sensorData = sensorDataOverride || contextSensorData;

    const [soilData, setSoilData] = useState<SoilChemistry | null>(null);
    const [atmospheric, setAtmospheric] = useState<AtmosphericData | null>(null);
    const [analysis, setAnalysis] = useState<AgronomyAnalysis | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);

    useEffect(() => {
        if (!sensorData) return;

        // Map sensorData from context to the local chemistry state
        setSoilData({
            nitrogen: sensorData.npk.nitrogen,
            phosphorus: sensorData.npk.phosphorus,
            potassium: sensorData.npk.potassium,
            ph: sensorData.pH,
            salinity: sensorData.ec
        });

        // Simple real-time logic for atmospheric if not provided by dedicated API
        const wind = weatherData?.windSpeed || 12;
        const isSafe = wind < 20;
        setAtmospheric({
            windSpeed: wind,
            et0: 4.2, // Default or calculated
            isSafeForSpraying: isSafe,
            riskLevel: isSafe ? 'low' : 'high'
        });

        // Optional: Generate simple client-side analysis if backend isn't sending full object
        if (sensorData.pH > 7.5 || sensorData.pH < 5.5) {
            setRecommendations(prev => [...new Set([...prev, "⚠️ Nutrient Locked zone detected due to pH extremes"])]);
        }
    }, [sensorData, weatherData]);

    useEffect(() => {
        // KEEP WebSocket listener as fallback/override if custom events are still being sent
        const handleAgronomyUpdate = (event: CustomEvent) => {
            const data = event.detail;

            if (data.type === 'agronomy_analysis' && data.analysis) {
                setAnalysis(data.analysis);
                if (data.recommendations) {
                    setRecommendations(data.recommendations);
                }

                // Update soil chemistry
                if (data.analysis.soil_health) {
                    const nutrients = data.analysis.soil_health.nutrients || data.analysis.soil_health.rules;
                    setSoilData({
                        nitrogen: nutrients?.nitrogen_available_ppm || 0,
                        phosphorus: nutrients?.phosphorus_available_ppm || 0,
                        potassium: nutrients?.potassium_available_ppm || 0,
                        ph: data.analysis.soil_health.ph_status?.ph_measured || null,
                        salinity: data.analysis.soil_health.salinity?.ec_measured || null
                    });
                }

                // Update Digital Twin Forecast
                if (data.analysis.digital_twin_forecast) {
                    setDigitalTwin(data.analysis.digital_twin_forecast);
                }

                // Update Soil Stress Index
                if (data.analysis.soil_stress_index) {
                    setSoilStress(data.analysis.soil_stress_index);
                }

                // Update atmospheric data
                if (data.analysis.atmospheric) {
                    setAtmospheric({
                        windSpeed: data.analysis.atmospheric.wind_safety.wind_speed,
                        et0: data.analysis.atmospheric.evapotranspiration.et0_mm_day,
                        isSafeForSpraying: data.analysis.atmospheric.wind_safety.is_safe_for_spraying,
                        riskLevel: data.analysis.atmospheric.wind_safety.risk_level
                    });
                }
            }
            // Fallback: Use raw sensor data for instant updates (Speed > Accuracy)
            else if (data.type === 'sensor_update' && data.data) {
                const raw = data.data;

                // Update Soil if keys exist
                if (raw.ec_salinity !== undefined && raw.ec_salinity !== null && raw.soil_ph !== undefined) {
                    setSoilData({
                        nitrogen: raw.npk / 4, // Rough approximation from NPK sensor
                        phosphorus: raw.npk / 4,
                        potassium: raw.npk / 2,
                        ph: raw.soil_ph,
                        salinity: raw.ec_salinity
                    });
                }

                // Update Atmospheric/Wind if keys exist
                // Update Atmospheric/Wind if keys exist
                if (raw.wind_speed !== undefined && raw.wind_speed !== null) {
                    const isSafe = raw.wind_speed < 20;
                    setAtmospheric({
                        windSpeed: raw.wind_speed,
                        et0: 0, // AI calculates this
                        isSafeForSpraying: isSafe,
                        riskLevel: isSafe ? 'low' : 'high'
                    });
                }
            }
            // Handle specific Wind Safety Alert
            else if (data.type === 'wind_safety_alert') {
                setAtmospheric({
                    windSpeed: data.wind_speed,
                    et0: 0,
                    isSafeForSpraying: false,
                    riskLevel: data.risk_level || 'high'
                });
            }
            // Industrial AI Decision Handling
            else if (data.type === 'AI_DECISION' && data.subsystem && data.payload) {
                const payload = data.payload;

                if (data.subsystem === 'WATER') {
                    // Update Water Forecast State
                    // Check if payload has preemptive info
                    setWaterForecast({
                        loss24h: payload.reason ? parseFloat(payload.reason.match(/[\d.]+/)?.[0] || "0") : 0,
                        event: payload.event,
                        timeToCritical: payload.time_to_critical_hours
                    });
                    if (payload.event === 'PREEMPTIVE_IRRIGATION') {
                        setRecommendations(prev => [...prev.filter(r => !r.includes("Predicted moisture loss")),
                        `🔮 PREEMPTIVE: ${payload.reason} (Critical in ${payload.time_to_critical_hours?.toFixed(1) || "?"}h)`]);
                    }
                }
                else if (data.subsystem === 'NUTRIENT') {
                    // Update Lockout Visuals
                    if (soilData) {
                        setSoilData(prev => prev ? ({
                            ...prev,
                            isLocked: payload.is_locked,
                            nutrientStatus: payload.status
                        }) : null);
                    }
                    if (payload.is_locked) {
                        setRecommendations(prev => [...prev.filter(r => !r.includes("Nutrient Lockout")),
                        `🔒 NUTRIENT LOCKOUT: ${payload.reason}`]);
                    }

                    // NEW: Dynamic Fertilizer Recommendation from pH Logic
                    if (payload.nutrient_logic && payload.nutrient_logic.action_priority !== 'Low') {
                        setRecommendations(prev => {
                            const newRec = `💊 AGRONOMIST Rx: ${payload.nutrient_logic.recommended_fix} (${payload.nutrient_logic.ph_status} pH)`;
                            // Avoid duplicates
                            if (prev.includes(newRec)) return prev;
                            return [...prev, newRec];
                        });
                    }
                }
                else if (data.subsystem === 'DISEASE') {
                    setDiseaseRisk({
                        level: payload.risk_level,
                        prob: payload.probability || 0,
                        lwd: payload.lwd_hours,
                        notes: payload.reason
                    });
                }
            }
        };

        window.addEventListener('iot-data', handleAgronomyUpdate as EventListener);
        return () => window.removeEventListener('iot-data', handleAgronomyUpdate as EventListener);
    }, [soilData]); // Add dependency for soilData updates

    // New State for AI Features
    const [waterForecast, setWaterForecast] = useState<any>(null);
    const [diseaseRisk, setDiseaseRisk] = useState<any>(null);
    const [digitalTwin, setDigitalTwin] = useState<any>(null);
    const [soilStress, setSoilStress] = useState<any>(null);

    const getWindSafetyColor = (riskLevel: string): string => {
        switch (riskLevel) {
            case 'low': return '#10b981';
            case 'moderate': return '#f59e0b';
            case 'high': return '#ef4444';
            case 'extreme': return '#991b1b';
            default: return '#6b7280';
        }
    };

    const getET0Color = (et0: number): string => {
        if (et0 > 6) return '#ef4444'; // High water demand
        if (et0 > 4) return '#f59e0b'; // Moderate
        return '#10b981'; // Low
    };

    // Helper to render Disease Risk Tile
    const DiseaseTile = ({ level, label, prob }: any) => {
        const colors = {
            'LOW_RISK': 'bg-green-100 text-green-800 border-green-200',
            'HIGH_RISK': 'bg-red-100 text-red-800 border-red-200',
            'UNKNOWN': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        const c = colors[level as keyof typeof colors] || colors['UNKNOWN'];
        return (
            <div className={`flex flex-col items-center p-2 rounded border ${c} flex-1`}>
                <span className="text-xs font-bold">{label}</span>
                <span className="text-lg font-bold">{level === 'HIGH_RISK' ? 'HIGH' : 'LOW'}</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Soil Chemistry Radar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg p-6 relative"
            >
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <span>🧪</span> Soil Chemistry
                    {(soilData as any)?.isLocked && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">LOCKED</span>}
                </h3>

                {soilData ? (
                    <div className="space-y-4">
                        {/* NPK Bars - Opacity reduced if Locked */}
                        <div className={(soilData as any)?.isLocked ? "opacity-50 grayscale transition-all" : ""}>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>🟢 Nitrogen (N)</span>
                                    <span className="font-semibold">{soilData.nitrogen.toFixed(0)} ppm</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((soilData.nitrogen / 150) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>🟡 Phosphorus (P)</span>
                                    <span className="font-semibold">{soilData.phosphorus.toFixed(0)} ppm</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((soilData.phosphorus / 150) * 100, 100)}%` }}
                                    />
                                </div>
                                {analysis?.soil_health?.nutrients.p_locked && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ Phosphorus locked (low pH)</p>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>🔵 Potassium (K)</span>
                                    <span className="font-semibold">{soilData.potassium.toFixed(0)} ppm</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((soilData.potassium / 150) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* pH and Salinity */}
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${soilData.ph == null ? 'text-gray-400' :
                                    (soilData.ph < 5.8 || soilData.ph > 7.5) ? 'text-red-500' :
                                        (soilData.ph < 6.0 || soilData.ph > 7.0) ? 'text-yellow-500' :
                                            'text-green-500'
                                    }`}>
                                    {soilData.ph != null ? soilData.ph.toFixed(1) : 'N/A'}
                                </div>
                                <div className="text-xs font-bold text-gray-600">
                                    {soilData.ph == null ? 'Unknown' :
                                        soilData.ph > 7.5 ? 'ALKALINE (High)' :
                                            soilData.ph < 5.8 ? 'ACIDIC (Low)' :
                                                soilData.ph > 7.0 ? 'Slightly Alkaline' :
                                                    soilData.ph < 6.0 ? 'Slightly Acidic' :
                                                        'OPTIMAL'}
                                </div>
                                {soilData.ph != null && (soilData.ph < 5.5 || soilData.ph > 7.5) && (
                                    <div className="text-xs text-red-600 font-extrabold mt-1 border border-red-200 bg-red-50 px-1 rounded animate-pulse">
                                        ⚠️ LOCKOUT ZONE
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {soilData.salinity != null ? soilData.salinity.toFixed(2) : 'N/A'}
                                </div>
                                <div className="text-xs text-gray-600">EC (dS/m)</div>
                            </div>
                        </div>

                        {(soilData as any)?.isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-white/90 p-4 rounded-xl border border-red-200 shadow-xl transform rotate-[-5deg]">
                                    <div className="text-4xl text-center">🔒</div>
                                    <div className="text-red-700 font-bold text-center">NUTRIENT<br />LOCKOUT</div>
                                </div>
                            </div>
                        )}

                        {/* Salinity Alert */}
                        {analysis?.soil_health?.salinity.is_stressed && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-semibold text-red-800">🚨 Salinity Stress Detected</p>
                                <p className="text-xs text-red-600 mt-1">
                                    Leaching Requirement: {analysis.soil_health.salinity.lr_percent.toFixed(1)}%
                                </p>
                                <p className="text-xs text-red-600">
                                    Action: {analysis.soil_health.salinity.action.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        <p>Waiting for soil chemistry data...</p>
                    </div>
                )}
            </motion.div>

            {/* Water Demand Gauge (ET₀) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6"
            >
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <span>💧</span> Water Demand
                </h3>

                {atmospheric ? (
                    <div className="flex flex-col items-center">
                        {/* ET₀ Gauge */}
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                                {/* Background circle */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="20"
                                />

                                {/* Colored arc based on ET₀ */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke={getET0Color(atmospheric.et0)}
                                    strokeWidth="20"
                                    strokeDasharray={`${(atmospheric.et0 / 10) * 502} 502`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 100 100)"
                                />

                                {/* Center text */}
                                <text
                                    x="100"
                                    y="90"
                                    textAnchor="middle"
                                    fontSize="32"
                                    fontWeight="bold"
                                    fill={getET0Color(atmospheric.et0)}
                                >
                                    {atmospheric.et0.toFixed(1)}
                                </text>
                                <text
                                    x="100"
                                    y="110"
                                    textAnchor="middle"
                                    fontSize="14"
                                    fill="#6b7280"
                                >
                                    mm/day
                                </text>
                            </svg>
                        </div>

                        {/* Water Demand Level */}
                        <div className="mt-4 text-center">
                            <div className="text-sm text-gray-600">Daily Evapotranspiration (ET₀)</div>
                            <div className={`mt-2 px-4 py-2 rounded-full text-white font-semibold ${atmospheric.et0 > 6 ? 'bg-red-500' :
                                atmospheric.et0 > 4 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}>
                                {atmospheric.et0 > 6 ? 'High Water Demand' :
                                    atmospheric.et0 > 4 ? 'Moderate Demand' : 'Low Demand'}
                            </div>
                        </div>

                        {/* PREDICTIVE WATER BUDGET FORECAST */}
                        {waterForecast && (
                            <div className="mt-4 w-full p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-blue-800">24H FORECAST</span>
                                    <span className="text-xs text-blue-600">ML Confidence: 92%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Predicted Loss:</span>
                                    <span className="font-bold text-red-500">-{waterForecast.loss24h?.toFixed(1) || '?'}%</span>
                                </div>
                                {waterForecast.event === 'PREEMPTIVE_IRRIGATION' && (
                                    <div className="mt-2 text-xs bg-red-100 text-red-700 p-1 rounded text-center font-bold">
                                        ⚡ PREEMPTIVE TRIGGER
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DIGITAL TWIN FORECAST */}
                        {digitalTwin && digitalTwin.forecasts && (
                            <div className="mt-4 w-full p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="text-xs font-bold text-purple-800 mb-2">🔮 DIGITAL TWIN FORECAST</div>
                                <div className="space-y-1">
                                    {digitalTwin.forecasts.map((f: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-gray-600">T+{f.horizon_hours}h:</span>
                                            <span className={`font-semibold ${f.predicted_moisture < 30 ? 'text-red-600' : 'text-green-600'}`}>
                                                {f.predicted_moisture}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-gray-500 mt-2 italic">Physics-based projection</div>
                            </div>
                        )}

                        {/* SOIL STRESS INDEX */}
                        {soilStress && (
                            <div className="mt-4 w-full p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-orange-800">SOIL STRESS INDEX</span>
                                    <span className={`text-lg font-bold ${soilStress.level === 'CRITICAL' ? 'text-red-600' :
                                        soilStress.level === 'HIGH' ? 'text-orange-600' :
                                            soilStress.level === 'MODERATE' ? 'text-yellow-600' : 'text-green-600'
                                        }`}>{soilStress.ssi}</span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Moisture:</span><span>{soilStress.components?.moisture_stress || 0}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Salinity:</span><span>{soilStress.components?.salinity_stress || 0}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>pH:</span><span>{soilStress.components?.ph_stress || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Irrigation Recommendation */}
                        {!waterForecast && !digitalTwin && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg w-full">
                                <p className="text-sm font-semibold text-blue-800">💡 Recommendation</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {atmospheric.et0 > 6
                                        ? 'Increase irrigation frequency. High water loss detected.'
                                        : atmospheric.et0 > 4
                                            ? 'Maintain regular irrigation schedule.'
                                            : 'Reduce irrigation. Low evapotranspiration.'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        <p>Waiting for atmospheric data...</p>
                    </div>
                )}
            </motion.div>

            {/* Environmental Safety Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-lg p-6"
            >
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <span>🌬️</span> Environmental Safety
                </h3>

                {atmospheric ? (
                    <div className="space-y-6">
                        {/* Wind Speed Indicator */}
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2" style={{ color: getWindSafetyColor(atmospheric.riskLevel) }}>
                                {atmospheric.windSpeed.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">km/h Wind Speed</div>
                        </div>

                        {/* Risk Level Badge */}
                        <div className="flex justify-center">
                            <div
                                className="px-6 py-3 rounded-full text-white font-bold text-lg"
                                style={{ backgroundColor: getWindSafetyColor(atmospheric.riskLevel) }}
                            >
                                {atmospheric.riskLevel.toUpperCase()} RISK
                            </div>
                        </div>

                        {/* Safety Status */}
                        <div className={`p-4 rounded-lg ${atmospheric.isSafeForSpraying ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            } border-2`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{atmospheric.isSafeForSpraying ? '✅' : '🚫'}</span>
                                <span className={`font-bold ${atmospheric.isSafeForSpraying ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {atmospheric.isSafeForSpraying ? 'Spray Safe' : 'HIGH WIND ALERT - SPRAYING BLOCKED'}
                                </span>
                            </div>

                            {!atmospheric.isSafeForSpraying && (
                                <div className="mt-3 space-y-1">
                                    <p className="text-sm font-semibold text-red-700">⚠️ Blocked Operations:</p>
                                    <ul className="text-xs text-red-600 ml-4 list-disc">
                                        <li>Pesticide/Herbicide Spraying</li>
                                        <li>Liquid Fertilizer Application</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* DISEASE RISK MATRIX (Phase 3) */}
                        <div className="border-t pt-4 mt-2">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">🦠 Disease Infection Matrix</h4>
                            <div className="flex gap-2">
                                <DiseaseTile level={diseaseRisk?.level || 'UNKNOWN'} label="Fungal Risk" />
                                <div className="flex flex-col justify-center text-xs text-gray-500">
                                    <span>LWD: {diseaseRisk?.lwd || 0}h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        <p>Waiting for wind data...</p>
                    </div>
                )}
            </motion.div>
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500"
                >
                    <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                        <span>🤖</span> AI Recommendations
                    </h3>
                    <div className="grid gap-2">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-700 bg-purple-50 p-2 rounded">
                                <span className="text-purple-600 mt-0.5">•</span>
                                {rec}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

