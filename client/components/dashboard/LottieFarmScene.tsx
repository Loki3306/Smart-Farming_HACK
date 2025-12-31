import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Droplets, Thermometer, Sprout, Sun, CloudRain, Wind, Brain } from 'lucide-react';
import farmScene from '@/assets/farmscene.json';
import cropAnimation from '@/assets/crop_optimised.json';
import rainAnimation from '@/assets/rain_optimised.json';

interface LottieFarmSceneProps {
    cropName?: string;
    sensorData?: {
        soilMoisture: number;
        temperature: number;
        npk: { nitrogen: number; potassium: number };
    };
    thresholds?: { moisture: [number, number] };
    onAiStatusClick?: () => void;
}

// Crop positions - centered within the field, bigger and well-positioned
const cropPositions = [
    // Bottom row (foreground - larger)
    { left: '20%', bottom: '8%', scale: 0.45 },
    { left: '40%', bottom: '5%', scale: 0.48 },
    { left: '60%', bottom: '7%', scale: 0.46 },
    { left: '80%', bottom: '6%', scale: 0.44 },
    // Middle row
    { left: '25%', bottom: '28%', scale: 0.35 },
    { left: '50%', bottom: '25%', scale: 0.38 },
    { left: '75%', bottom: '27%', scale: 0.36 },
    // Back row (smaller for perspective)
    { left: '35%', bottom: '45%', scale: 0.25 },
    { left: '55%', bottom: '42%', scale: 0.28 },
    { left: '70%', bottom: '44%', scale: 0.26 },
];

/**
 * Immersive Animated Farm Scene with HUD
 * Replaces the old RealisticFarmView with Lottie animations
 */
const LottieFarmScene: React.FC<LottieFarmSceneProps> = ({
    cropName = "Wheat",
    sensorData = { soilMoisture: 65, temperature: 24, npk: { nitrogen: 50, potassium: 50 } },
    thresholds = { moisture: [40, 80] },
    onAiStatusClick
}) => {
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
                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <Sun className="w-5 h-5 text-amber-500 animate-[spin_10s_linear_infinite]" />
                </div>
            </div>

            {/* MAIN LOTTIE VISUALIZATION */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl h-72 group">
                {/* Layer 1: Base Farm Scene (fills entire container, scaled up) */}
                <div className="absolute inset-0 z-10" style={{ margin: '-10%', width: '120%', height: '120%' }}>
                    <Lottie
                        animationData={farmScene}
                        loop={true}
                        autoplay={true}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        rendererSettings={{
                            preserveAspectRatio: 'xMidYMid slice'
                        }}
                    />
                </div>

                {/* Layer 2: Multiple Crop Animations */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {cropPositions.map((pos, index) => (
                        <div
                            key={index}
                            className="absolute"
                            style={{
                                left: pos.left,
                                bottom: pos.bottom,
                                transform: `translateX(-50%) scale(${pos.scale})`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <Lottie
                                animationData={cropAnimation}
                                loop={false}
                                autoplay={true}
                                initialSegment={[0, 70]}
                                style={{
                                    width: '200px',
                                    height: '200px',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Layer 3: Rain Animation (when irrigating) */}
                {isWet && (
                    <div className="absolute inset-0 z-30 pointer-events-none" style={{ margin: '-10%', width: '120%', height: '120%' }}>
                        <Lottie
                            animationData={rainAnimation}
                            loop={true}
                            autoplay={true}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            rendererSettings={{
                                preserveAspectRatio: 'xMidYMid slice'
                            }}
                        />
                    </div>
                )}

                {/* Glassmorphism HUD (Floating Stats) */}
                <div className="absolute top-3 left-3 right-3 z-40 flex justify-between">
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

                {/* Vignette overlay */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] rounded-2xl z-35" />
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
        </div>
    );
};

export default LottieFarmScene;
