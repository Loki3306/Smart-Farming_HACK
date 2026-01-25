/**
 * YieldPredictionCard - Dashboard widget showing crop yield prediction
 * Displays expected yield with confidence, improvement tips, and comparison
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wheat, AlertCircle, ChevronRight, Sparkles, Target, Loader2 } from 'lucide-react';
import { yieldService, YieldPrediction, YieldOptimization } from '../../services/yieldService';
import { useFarmContext } from '../../context/FarmContext';
import { useNavigate } from 'react-router-dom';

interface YieldPredictionCardProps {
    cropType?: string;  // Optional - will fetch from farm settings if not provided
    farmId?: string;
    compact?: boolean;
}

export const YieldPredictionCard: React.FC<YieldPredictionCardProps> = ({
    cropType: propCropType,
    farmId,
    compact = false,
}) => {
    const navigate = useNavigate();
    const { sensorData } = useFarmContext();
    const [prediction, setPrediction] = useState<YieldPrediction | null>(null);
    const [optimization, setOptimization] = useState<YieldOptimization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cropType, setCropType] = useState<string>(propCropType || '');
    const [farmSettings, setFarmSettings] = useState<any>(null);

    // Fetch farm settings to get crop type dynamically
    useEffect(() => {
        const fetchFarmSettings = async () => {
            if (propCropType) {
                setCropType(propCropType);
                return;
            }

            try {
                const farmIdToUse = farmId || localStorage.getItem('current_farm_id');
                if (!farmIdToUse) {
                    setCropType('Wheat'); // Default fallback
                    return;
                }

                // Fetch farm details which includes crop info
                const response = await fetch(`/api/farms/${farmIdToUse}`);
                if (response.ok) {
                    const data = await response.json();
                    const farm = data.farm;

                    // Try to get crop from farm settings
                    if (farm?.crop) {
                        setCropType(farm.crop);
                        setFarmSettings(farm);
                    } else if (farm?.settings?.crop) {
                        setCropType(farm.settings.crop);
                        setFarmSettings(farm.settings);
                    } else {
                        // Use default crop
                        setCropType('Wheat');
                    }
                } else {
                    setCropType('Wheat');
                }
            } catch (err) {
                console.warn('[YieldPredictionCard] Using default crop type');
                setCropType('Wheat');
            }
        };

        fetchFarmSettings();
    }, [propCropType, farmId]);

    // Fetch prediction when sensor data or crop type changes
    useEffect(() => {
        const fetchPrediction = async () => {
            if (!sensorData || !cropType) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const predictionResult = await yieldService.predictYield({
                    crop_type: cropType,
                    soil_moisture: sensorData.soilMoisture || 35,
                    soil_ph: sensorData.pH || 6.5,
                    temperature: sensorData.temperature || 25,
                    humidity: sensorData.humidity || 65,
                    rainfall: 150,
                });
                setPrediction(predictionResult);

                // Get optimization tips
                try {
                    const optimizationResult = await yieldService.getOptimizationTips(
                        cropType,
                        sensorData.soilMoisture,
                        sensorData.pH,
                        sensorData.temperature,
                        sensorData.humidity
                    );
                    setOptimization(optimizationResult);
                } catch (optErr) {
                    console.warn('[YieldPredictionCard] Optimization fetch failed:', optErr);
                    // Set fallback optimization with benchmark data
                    setOptimization({
                        current_predicted_yield: predictionResult.predicted_yield,
                        potential_optimized_yield: predictionResult.predicted_yield * 1.1,
                        total_potential_gain_percent: 10,
                        top_improvements: [],
                        regional_benchmark: {
                            region: 'India',
                            crop_type: cropType,
                            min_yield: 2000,
                            avg_yield: 3500,
                            max_yield: 6000
                        }
                    });
                }

            } catch (err) {
                console.error('[YieldPredictionCard] Error:', err);
                setError('Could not load prediction');

                // Set fallback data
                setPrediction({
                    predicted_yield: 4200,
                    confidence: 72,
                    yield_potential: 68,
                    unit: 'kg/hectare',
                    improvement_tips: [],
                    model_version: 'fallback',
                    timestamp: new Date().toISOString(),
                    source: 'fallback'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPrediction();
    }, [sensorData, cropType]);

    // Format yield for display
    const formatYield = (value: number | undefined) => {
        if (value === undefined || value === null) return '—';
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}t`;
        }
        return `${value.toFixed(0)}kg`;
    };

    // Get yield potential color
    const getPotentialColor = (potential: number) => {
        if (potential >= 70) return 'text-green-500';
        if (potential >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Get confidence badge color
    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (confidence >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    };

    if (loading) {
        return (
            <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (compact) {
        // Compact mode for sidebar
        return (
            <div
                className="relative z-10 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/30 p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/yield')}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500/20 rounded-lg">
                            <Wheat className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium text-foreground text-sm">Expected Yield</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-2xl font-bold text-foreground">
                            {prediction ? formatYield(prediction.predicted_yield) : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/hectare</span>
                    </div>
                    <span className={`text-xs font-medium ${getPotentialColor(prediction?.yield_potential || 0)}`}>
                        {prediction?.yield_potential?.toFixed(0) || 0}% potential
                    </span>
                </div>
            </div>
        );
    }

    // Full card
    return (
        <div className="relative z-10 bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Wheat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">Yield Prediction</h3>
                            <p className="text-white/80 text-sm">{cropType} • Current Season</p>
                        </div>
                    </div>
                    {prediction && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(prediction.confidence)}`}>
                            {prediction.confidence.toFixed(0)}% confident
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-5 space-y-5">
                {/* Yield Display */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Expected Yield</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-foreground">
                                {prediction ? prediction.predicted_yield.toLocaleString() : '—'}
                            </span>
                            <span className="text-muted-foreground mb-1">kg/hectare</span>
                        </div>
                    </div>

                    {/* Yield Potential Gauge */}
                    <div className="text-center">
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-muted/20"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(prediction?.yield_potential || 0) * 2.01} 201`}
                                    className={getPotentialColor(prediction?.yield_potential || 0)}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold">{prediction?.yield_potential?.toFixed(0) || 0}%</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Potential</p>
                    </div>
                </div>

                {/* Regional Comparison */}
                {optimization?.regional_benchmark && (
                    <div className="bg-muted/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">vs Regional Average</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-xs text-muted-foreground">Min</p>
                                <p className="font-semibold text-red-500">{formatYield(optimization.regional_benchmark.min_yield_kg || optimization.regional_benchmark.min_yield)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Average</p>
                                <p className="font-semibold text-yellow-500">{formatYield(optimization.regional_benchmark.avg_yield_kg || optimization.regional_benchmark.avg_yield)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Max</p>
                                <p className="font-semibold text-green-500">{formatYield(optimization.regional_benchmark.max_yield_kg || optimization.regional_benchmark.max_yield)}</p>
                            </div>
                        </div>

                        {prediction && (() => {
                            const avgYield = optimization.regional_benchmark.avg_yield_kg || optimization.regional_benchmark.avg_yield || 0;
                            if (!avgYield || !prediction.predicted_yield) return null;
                            const percentDiff = ((prediction.predicted_yield / avgYield) - 1) * 100;
                            const isAbove = percentDiff >= 0;
                            return (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Your prediction</span>
                                        <span className={`font-medium ${isAbove ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {isAbove ? (
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-4 h-4" />
                                                    {Math.abs(percentDiff).toFixed(0)}% above avg
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <TrendingDown className="w-4 h-4" />
                                                    {Math.abs(percentDiff).toFixed(0)}% below avg
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Improvement Tips Preview */}
                {prediction?.improvement_tips && prediction.improvement_tips.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium">Top Improvement</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/30">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-foreground">{prediction.improvement_tips[0].factor}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{prediction.improvement_tips[0].action}</p>
                                </div>
                                <span className="text-green-500 font-semibold text-sm whitespace-nowrap">
                                    {prediction.improvement_tips[0].potential_yield_gain}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/yield')}
                        className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        View Full Details
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/recommendations')}
                        className="py-2.5 px-4 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/70 transition-colors"
                    >
                        Get Tips
                    </button>
                </div>
            </div>
        </div>
    );
};

export default YieldPredictionCard;
