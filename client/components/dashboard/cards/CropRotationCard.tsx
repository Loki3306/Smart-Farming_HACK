import React, { useEffect, useState } from 'react';
import { Leaf, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useFarmContext } from '../../../context/FarmContext';

interface RotationStrategy {
    recommended_crop: string;
    recovery_score: number;
    benefit: string;
    reasoning: string;
}

export const CropRotationCard: React.FC = () => {
    const { sensorData } = useFarmContext();
    const [strategy, setStrategy] = useState<RotationStrategy | null>(null);
    const [loading, setLoading] = useState(false);

    // Configurable current crop (could come from farm settings)
    const [currentCrop, setCurrentCrop] = useState("Maize");

    const fetchStrategy = async () => {
        setLoading(true);
        try {
            // Mock simulation of API delay
            // In a real scenario, use:
            // const response = await fetch('/api/iot/rotation/strategy', { ... }); 

            const payload = {
                current_crop: currentCrop,
                n_level: sensorData?.npk?.nitrogen || 180, // Default to depleted if no sensor
                moisture: sensorData?.soilMoisture || 45, // Fixed property access
                soil_type: "Clay Loam"
            };

            // Use the Express Proxy (which forwards /api/python/* to :8000/*)
            // This works both locally and via Ngrok on phone
            const response = await fetch(`/api/python/iot/rotation/strategy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    setStrategy(data.strategy);
                }
            }
        } catch (error) {
            console.error("Failed to fetch rotation strategy", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategy();
    }, [currentCrop, sensorData?.soilMoisture]); // Re-fetch on crop or moisture change

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group transition-all duration-300 hover:shadow-md">

            {/* Background Gradient Blob */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/10 rounded-full blur-3xl opacity-60"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/30 rounded-xl text-green-700 shadow-sm border border-green-100/50">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">Crop Rotation AI</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Smart Soil Recovery Strategy</p>
                    </div>
                </div>

                {/* Simulated Controls (Subtle) */}
                <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setCurrentCrop("Maize")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentCrop === "Maize" ? 'bg-white dark:bg-gray-600 shadow-sm text-green-700 dark:text-green-400' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Maize
                    </button>
                    <button
                        onClick={() => setCurrentCrop("Rice")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentCrop === "Rice" ? 'bg-white dark:bg-gray-600 shadow-sm text-green-700 dark:text-green-400' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Rice
                    </button>
                    <button
                        onClick={() => setCurrentCrop("Cotton")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentCrop === "Cotton" ? 'bg-white dark:bg-gray-600 shadow-sm text-green-700 dark:text-green-400' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Cotton
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                    <p className="text-sm text-gray-500">Analyzing soil depletion...</p>
                </div>
            ) : strategy ? (
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Column 1: Recommendation & Gauge */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-700/30 dark:to-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                        {/* Circular Progress Gauge */}
                        <div className="relative w-28 h-28 mb-4">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                                <circle
                                    cx="56" cy="56" r="48"
                                    stroke="currentColor" strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 48}
                                    strokeDashoffset={2 * Math.PI * 48 * (1 - strategy.recovery_score / 100)}
                                    className="text-green-500 transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-gray-800 dark:text-white">{strategy.recovery_score}%</span>
                                <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Recovery</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {strategy.recommended_crop}
                            </h2>
                            {strategy.recommended_crop.includes("Soybean") || strategy.recommended_crop.includes("Chickpea") ? <Leaf className="w-5 h-5 text-green-500 fill-green-500" /> : <Sprout className="w-5 h-5 text-amber-500" />}
                        </div>
                        <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full font-medium">
                            Optimal Next Crop
                        </p>
                    </div>

                    {/* Column 2: Strategy Details & Timeline */}
                    <div className="md:col-span-2 space-y-5">
                        {/* Reasoning Block */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Strategy Reasoning</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {strategy.reasoning}
                            </p>
                        </div>

                        {/* Impact Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Water Impact</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">-15% Usage</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Projected Yield</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">High</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                                <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Soil N-Fix</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 font-mono">+40kg/ha</p>
                            </div>
                        </div>

                        {/* Benefit Highlight */}
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 rounded-xl border-l-4 border-green-500">
                            <div className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                <Leaf className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-800 dark:text-green-400 uppercase mb-0.5">Primary Benefit</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{strategy.benefit}</p>
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-center py-6 text-gray-500">
                    Unable to generate strategy.
                </div>
            )}
        </div>
    );
};

// Simple Icon component fallback if needed, but Sprout is imported from lucide-react
function Sprout({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1.7-1.3 2.9-3.3 3-5.5-3 0-5.3 1-6.2 2.9z" />
        </svg>
    )
}
