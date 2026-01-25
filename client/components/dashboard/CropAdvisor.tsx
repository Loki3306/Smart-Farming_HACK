/**
 * Crop Advisor UI Component
 * Provides strategic AI-driven crop consultation
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Recommendation {
    selected_crop: string;
    confidence: number;
    rationale: string;
    market_winner: string | null;
    economic_switch: boolean;
    top_candidates: { crop: string; probability: number }[];
    financials: {
        estimated_cost: number;
        projected_revenue: number;
        net_profit: number;
        roi_percentage: number;
        yield_per_acre_kg: number;
        soil_health_score: number;
    };
    sowing_protocol: {
        depth: string;
        spacing: string;
        rate: string;
        treatment: string;
    };
    season_roadmap: {
        "Phase 1": string;
        "Phase 2": string;
        "Phase 3": string;
        "Irrigation": string;
    };
}

interface CropAdvisorProps {
    sensorData: any; // Passed from parent dashboard
}

interface DetailedRecommendation extends Recommendation {
    top_candidates: {
        crop: string;
        probability: number;
        financials?: any;
        sowing_protocol?: any;
        season_roadmap?: any;
    }[];
}

export const CropAdvisor: React.FC<CropAdvisorProps> = ({ sensorData }) => {
    const [rec, setRec] = useState<DetailedRecommendation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

    const runAnalysis = async () => {
        if (!sensorData) return;

        setLoading(true);
        setError(null);

        try {
            // Extract sensor values (handle different data structures)
            // Default to safe values if missing
            const payload = {
                n: sensorData.nitrogen || 60,
                p: sensorData.phosphorus || 40,
                k: sensorData.potassium || 40,
                ph: sensorData.ph || 6.5,
                moisture: sensorData.moisture || 50,
                temperature: sensorData.temperature || 25,
                humidity: sensorData.humidity || 60,
                rainfall: 120.0 // Default or from weather API
            };

            const response = await fetch('http://localhost:8000/iot/recommend-crop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            setRec(data);

            // Find index of selected crop to set default view
            const idx = data.top_candidates.findIndex((c: any) => c.crop === data.selected_crop);
            setSelectedCandidateIndex(idx >= 0 ? idx : 0);

        } catch (err) {
            setError("Failed to run analysis. Ensure backend is running.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-run analysis when sensor data loads/changes
    React.useEffect(() => {
        if (sensorData && (sensorData.nitrogen > 0 || sensorData.ph > 0)) {
            const timer = setTimeout(() => {
                runAnalysis();
            }, 1000); // 1s debounce to avoid flickering during sensor settle
            return () => clearTimeout(timer);
        }
    }, [sensorData]);

    const viewingCandidate = rec?.top_candidates[selectedCandidateIndex];
    // Fallback to root data if individual data not found (backward compatibility)
    const financials = viewingCandidate?.financials || rec?.financials;
    const sowing = viewingCandidate?.sowing_protocol || rec?.sowing_protocol;
    const roadmap = viewingCandidate?.season_roadmap || rec?.season_roadmap;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                        Strategic Crop Advisor
                    </h2>
                    <p className="text-sm text-gray-500">AI-driven biological & econometrics engine</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Refreshed Banner */}
                    {rec && (
                        <div className="text-xs text-gray-400 font-mono">
                            Viewing: {viewingCandidate?.crop}
                        </div>
                    )}
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg'
                            }`}
                    >
                        {loading ? 'Analyzing...' : 'Run Strategic Analysis'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {rec && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* PRIMARY RECOMMENDATION CARD */}
                    <div className={`p-6 rounded-xl border-l-8 ${rec.economic_switch ? 'bg-amber-50 border-amber-500' : 'bg-green-50 border-green-500'
                        } shadow-sm`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-1">
                                    Official Recommendation
                                </div>
                                <h3 className="text-4xl font-extrabold text-gray-900 mb-2">
                                    {rec.selected_crop}
                                </h3>

                                {rec.economic_switch && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 mb-3">
                                        💰 Profit Optimized (+30% ROI)
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-green-600">{rec.confidence}%</div>
                                <div className="text-xs text-gray-500">Confidence Score</div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                AI Rationale
                            </h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {rec.rationale}
                            </p>
                        </div>
                    </div>

                    {/* TOP CANDIDATES ROW - CLICKABLE */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 mt-4 ml-1 uppercase">Select Crop to View Strategy:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {rec.top_candidates.map((cand, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedCandidateIndex(idx)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all transform hover:scale-105 ${idx === selectedCandidateIndex
                                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-md'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${idx === selectedCandidateIndex ? 'text-blue-800' : 'text-gray-800'}`}>
                                                #{idx + 1} {cand.crop}
                                            </span>
                                            {cand.crop === rec.selected_crop && <span className="text-[10px] text-green-600 font-bold uppercase">Officially Recommended</span>}
                                        </div>
                                        <span className="text-sm font-mono text-gray-500">{cand.probability.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`${idx === selectedCandidateIndex ? 'bg-blue-500' : 'bg-gray-400'} h-full transition-all`}
                                            style={{ width: `${cand.probability}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DYNAMIC DETAILS PANEL */}
                    <div className="animate-fade-in relative">
                        {/* TITLE OF CURRENT VIEW */}
                        <div className="mb-4 flex items-center justify-center">
                            <span className="bg-slate-800 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                Showing Data For: {viewingCandidate?.crop}
                            </span>
                        </div>

                        {/* FINANCIAL LEDGER */}
                        {financials && (
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg mb-6">
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">💸</span> Financial Forecast ({(financials as any).area_acres || 5} acres)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">Est. Cost</div>
                                        <div className="text-xl font-mono text-red-400">₹{(financials as any).estimated_cost.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">Revenue</div>
                                        <div className="text-xl font-mono text-green-400">₹{(financials as any).projected_revenue.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">Net Profit</div>
                                        <div className="text-2xl font-mono font-bold text-yellow-400">₹{(financials as any).net_profit.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">ROI</div>
                                        <div className="text-xl font-mono text-blue-400">{(financials as any).roi_percentage}%</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SOWING PROTOCOL */}
                        {sowing && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                                    <Sprout className="w-5 h-5 text-green-600" />
                                    Technical Sowing Protocol ({viewingCandidate?.crop})
                                </h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs font-bold text-green-800 uppercase">Depth</div>
                                        <div className="font-semibold text-gray-700">{(sowing as any).depth}</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs font-bold text-green-800 uppercase">Spacing</div>
                                        <div className="font-semibold text-gray-700">{(sowing as any).spacing}</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs font-bold text-green-800 uppercase">Seed Rate</div>
                                        <div className="font-semibold text-gray-700">{(sowing as any).rate}</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs font-bold text-green-800 uppercase">Treatment</div>
                                        <div className="font-semibold text-gray-700">{(sowing as any).treatment}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SEASON ROADMAP */}
                        {roadmap && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                                    🗓️ Season Roadmap ({viewingCandidate?.crop})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(roadmap).map(([phase, plan], idx) => (
                                        <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{phase}</div>
                                            <div className="text-sm font-medium text-gray-700">{plan as string}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
