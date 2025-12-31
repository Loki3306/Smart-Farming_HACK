import React, { useState, useEffect } from 'react';
import { Droplets, Thermometer, Sprout, Wind, Sun, CloudRain, Brain } from 'lucide-react';

interface RealisticFarmViewProps {
    cropName?: string;
    sensorData?: {
        soilMoisture: number;
        temperature: number;
        npk: { nitrogen: number; potassium: number };
    };
    thresholds?: { moisture: [number, number] };
    onAiStatusClick?: () => void;
}

const RealisticFarmView: React.FC<RealisticFarmViewProps> = ({
    cropName = "Wheat",
    sensorData = { soilMoisture: 65, temperature: 24, npk: { nitrogen: 50, potassium: 50 } },
    thresholds = { moisture: [40, 80] },
    onAiStatusClick
}) => {
    // Animation state for "breathing" effect
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => (t + 1) % 100), 50);
        return () => clearInterval(interval);
    }, []);

    // Calculate Environment State
    const moisture = sensorData?.soilMoisture ?? 50;
    const isWet = moisture > 70;
    const isDry = moisture < thresholds.moisture[0];
    const healthStatus = isDry ? 'stressed' : isWet ? 'saturated' : 'healthy';

    // --- Internal Components ---

    // 1. Procedural Plant SVG (Replaces Emoji)
    const PlantNode = ({ index, status }: { index: number; status: string }) => {
        // Randomize slight variations so it looks organic
        const randomHeight = 20 + (index % 3) * 5;
        const sway = Math.sin((tick + index * 10) / 10) * 2; // Gentle sway calculation

        // Dynamic Colors based on health
        const stemColor = status === 'stressed' ? '#D4A373' : '#4ADE80'; // Brownish vs Bright Green
        const leafColor = status === 'stressed' ? '#E9C46A' : '#22C55E';

        return (
            <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
                style={{
                    transform: `translateX(-50%) rotate(${sway}deg) scale(${status === 'stressed' ? 0.9 : 1})`,
                    zIndex: 10 + index
                }}
            >
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none" className="drop-shadow-lg">
                    {/* Stem */}
                    <path
                        d={`M20 50 Q${20 + sway} 30 20 ${50 - randomHeight}`}
                        stroke={stemColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    {/* Leaf Left */}
                    <path
                        d={`M20 ${50 - randomHeight + 10} Q10 ${50 - randomHeight} 5 ${50 - randomHeight - 5}`}
                        stroke={leafColor}
                        strokeWidth="2"
                        fill="none"
                        className="opacity-90"
                    />
                    {/* Leaf Right */}
                    <path
                        d={`M20 ${50 - randomHeight + 5} Q30 ${50 - randomHeight - 5} 35 ${50 - randomHeight - 15}`}
                        stroke={leafColor}
                        strokeWidth="2"
                        fill="none"
                        className="opacity-90"
                    />
                    {/* Fruit/Grain Head (if healthy) */}
                    {status === 'healthy' && (
                        <circle cx="20" cy={50 - randomHeight} r="3" fill="#FDE047" className="animate-pulse" />
                    )}
                </svg>
            </div>
        );
    };

    // 2. Isometric Soil Block
    const SoilBlock = ({ id, delay }: { id: number; delay: number }) => {
        // Soil texture logic
        const soilColor = isWet
            ? 'bg-stone-800' // Dark wet earth
            : isDry
                ? 'bg-amber-100/80' // Dry dusty earth
                : 'bg-stone-700'; // Normal earth

        return (
            <div
                className={`relative h-24 w-full rounded-xl transition-all duration-700 group`}
                style={{ transitionDelay: `${delay}ms` }}
            >
                {/* The 3D Soil Surface */}
                <div className={`absolute inset-0 rounded-xl ${soilColor} shadow-[inset_0_2px_10px_rgba(0,0,0,0.4)] border-t border-white/10 overflow-hidden transform transition-transform group-hover:-translate-y-1`}>

                    {/* Texture Overlay (Noise) */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-gradient-to-br from-white/10 to-black/10"></div>

                    {/* Moisture Gradient overlay */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-blue-900/40 to-transparent transition-opacity duration-1000 ${isWet ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Dry Crack Pattern Overlay */}
                    {isDry && (
                        <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-multiply" preserveAspectRatio="none">
                            <path d="M10,10 L30,40 M60,10 L40,50 M80,20 L70,80" stroke="#78350f" strokeWidth="1" />
                        </svg>
                    )}

                    {/* Plant Logic */}
                    <PlantNode index={id} status={healthStatus} />

                    {/* Water Particles (Sprinkler Effect) */}
                    {isWet && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="particle w-1 h-1 bg-blue-400 rounded-full absolute top-0 left-1/4 animate-rain-drop" style={{ animationDelay: '0s' }}></div>
                            <div className="particle w-1 h-1 bg-blue-400 rounded-full absolute top-2 right-1/4 animate-rain-drop" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                    )}
                </div>

                {/* 3D Depth Shadow below the block */}
                <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/40 blur-md rounded-full -z-10 group-hover:scale-90 transition-transform"></div>
            </div>
        );
    };

    return (
        <div className="w-full p-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        🌾 {cropName} Field
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className={`w-2 h-2 rounded-full ${healthStatus === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : healthStatus === 'saturated' ? 'bg-blue-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                        Live Digital Twin
                    </div>
                </div>
                {/* Time of Day Indicator */}
                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <Sun className="w-5 h-5 text-amber-500 animate-[spin_10s_linear_infinite]" />
                </div>
            </div>

            {/* --- MAIN VISUALIZATION STAGE --- */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-b from-sky-300 via-sky-100 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-white/20 h-72 group">

                {/* 1. Atmospheric Background Layer */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Sun Glow */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-300/20 rounded-full blur-3xl"></div>
                    {/* Clouds */}
                    <div className="absolute top-6 left-10 w-24 h-6 bg-white/40 blur-xl rounded-full animate-[float_10s_ease-in-out_infinite]"></div>
                    <div className="absolute top-10 right-16 w-16 h-4 bg-white/30 blur-lg rounded-full animate-[float_8s_ease-in-out_infinite_1s]"></div>
                    {/* Rain Overlay if wet */}
                    {isWet && <div className="absolute inset-0 bg-slate-900/10 z-20 backdrop-blur-[1px]"></div>}
                </div>

                {/* 2. Glassmorphism HUD (Floating Stats) */}
                <div className="absolute top-3 left-3 right-3 z-30 flex justify-between">
                    <div className="flex gap-2">
                        <div className="backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 p-2 rounded-xl flex flex-col items-center min-w-[60px] shadow-lg transform hover:scale-105 transition-transform cursor-default">
                            <Droplets className={`w-4 h-4 mb-1 ${isWet ? 'text-blue-500' : isDry ? 'text-amber-500' : 'text-slate-500'}`} />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{Math.round(moisture)}%</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-300">Moisture</span>
                        </div>
                        <div className="backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 p-2 rounded-xl flex flex-col items-center min-w-[60px] shadow-lg transform hover:scale-105 transition-transform cursor-default">
                            <Thermometer className="w-4 h-4 mb-1 text-orange-500" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{sensorData?.temperature?.toFixed(1)}°</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-300">Temp</span>
                        </div>
                    </div>

                    <div className={`backdrop-blur-md px-3 py-1 rounded-full h-fit flex items-center gap-2 shadow-lg border ${healthStatus === 'healthy'
                        ? 'bg-emerald-500/20 border-emerald-500/30'
                        : healthStatus === 'saturated'
                            ? 'bg-blue-500/20 border-blue-500/30'
                            : 'bg-amber-500/20 border-amber-500/30'
                        }`}>
                        <Sprout className={`w-4 h-4 ${healthStatus === 'healthy'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : healthStatus === 'saturated'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`} />
                        <span className={`text-xs font-semibold ${healthStatus === 'healthy'
                            ? 'text-emerald-800 dark:text-emerald-200'
                            : healthStatus === 'saturated'
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-amber-800 dark:text-amber-200'
                            }`}>
                            {healthStatus.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* 3. The Isometric Farm Grid */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[95%] grid grid-cols-3 gap-2 p-4 pb-6">
                    {/* Irrigation Pipes Background */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 via-blue-400/30 to-transparent -z-10 blur-[1px]"></div>

                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <SoilBlock key={i} id={i} delay={i * 100} />
                    ))}
                </div>

                {/* 4. Overlay Effects */}
                {/* Dynamic Vignette */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] rounded-2xl"></div>
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between items-center mt-2 px-2 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-xs font-mono text-muted-foreground">Sector A1</span>
                <div className="flex gap-3 items-center">
                    {isWet && <span className="flex items-center gap-1 text-xs text-blue-500"><CloudRain size={12} /> Irrigating</span>}
                    {isDry && <span className="flex items-center gap-1 text-xs text-amber-500"><Wind size={12} /> Needs Water</span>}
                    {!isWet && !isDry && <span className="flex items-center gap-1 text-xs text-green-500"><Sprout size={12} /> Optimal</span>}

                    {/* AI Status Button */}
                    {onAiStatusClick && (
                        <button
                            onClick={onAiStatusClick}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-medium transition-all hover:scale-105"
                            title="View AI System Status"
                        >
                            <Brain size={14} />
                            <span>AI Status</span>
                        </button>
                    )}
                </div>
            </div>

            {/* CSS Animations Injection */}
            <style>{`
        @keyframes rain-drop {
          0% { transform: translateY(-10px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        .animate-rain-drop {
          animation: rain-drop 0.8s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(20px); }
        }
      `}</style>
        </div>
    );
};

export default RealisticFarmView;
