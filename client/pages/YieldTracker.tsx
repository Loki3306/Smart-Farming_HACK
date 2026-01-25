/**
 * YieldTracker Page - Comprehensive yield tracking and comparison
 * Features: Active crops, harvest logging, history, and analytics
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wheat, ArrowLeft, Plus, TrendingUp, TrendingDown, Calendar,
    BarChart3, Target, Check, X, Loader2, ChevronRight, Sparkles,
    ClipboardCheck, History, Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { yieldService, YieldRecord, YieldComparison as YieldComparisonType } from '../services/yieldService';
import { YieldPredictionCard } from '../components/yield/YieldPredictionCard';
import { SpacingCalculator } from '../components/spacing/SpacingCalculator';

export const YieldTracker: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'active' | 'history' | 'compare'>('active');
    const [yields, setYields] = useState<YieldRecord[]>([]);
    const [comparisons, setComparisons] = useState<YieldComparisonType[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showLogModal, setShowLogModal] = useState(false);
    const [selectedYield, setSelectedYield] = useState<YieldRecord | null>(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            setLoading(true);

            try {
                // Fetch active crops
                const activeYields = await yieldService.getYields(user.id, 'growing');
                const harvestedYields = await yieldService.getYields(user.id, 'harvested', 10);
                setYields([...activeYields, ...harvestedYields]);

                // Fetch comparison data
                const comparisonData = await yieldService.getComparison(user.id);
                setComparisons(comparisonData.comparisons);
                setStats(comparisonData.stats);
            } catch (error) {
                console.error('[YieldTracker] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    const activeYields = yields.filter(y => y.status === 'growing');
    const harvestedYields = yields.filter(y => y.status === 'harvested');

    // Format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Calculate days
    const calculateDays = (fromDate?: string, toDate?: string) => {
        if (!fromDate) return null;
        const from = new Date(fromDate);
        const to = toDate ? new Date(toDate) : new Date();
        return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Handle log harvest click
    const handleLogHarvest = (yieldRecord: YieldRecord) => {
        setSelectedYield(yieldRecord);
        setShowLogModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-2xl">
                            <Wheat className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Yield Tracker</h1>
                            <p className="text-muted-foreground">Track, predict, and compare your crop yields</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {/* TODO: Add new crop modal */ }}
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Add Crop
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-2 flex gap-2">
                            {[
                                { id: 'active', label: 'Active Crops', icon: Wheat },
                                { id: 'history', label: 'History', icon: History },
                                { id: 'compare', label: 'Compare', icon: Scale },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {loading ? (
                            <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-12 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : activeTab === 'active' ? (
                            /* Active Crops */
                            <div className="space-y-4">
                                {activeYields.length === 0 ? (
                                    <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8 text-center">
                                        <Wheat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="font-semibold text-foreground mb-2">No Active Crops</h3>
                                        <p className="text-muted-foreground mb-4">Start tracking your crops to get yield predictions</p>
                                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium">
                                            <Plus className="w-4 h-4 inline mr-2" />
                                            Add Your First Crop
                                        </button>
                                    </div>
                                ) : (
                                    activeYields.map(yieldRecord => (
                                        <div key={yieldRecord.id} className="bg-card rounded-2xl shadow-lg border border-border/50 p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-500/20 rounded-xl">
                                                        <Wheat className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-foreground">{yieldRecord.crop_type}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Sowed {formatDate(yieldRecord.sowing_date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                    Growing
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="text-center p-3 bg-muted/30 rounded-xl">
                                                    <p className="text-xs text-muted-foreground mb-1">Days Growing</p>
                                                    <p className="font-bold text-foreground">
                                                        {calculateDays(yieldRecord.sowing_date) || '—'}
                                                    </p>
                                                </div>
                                                <div className="text-center p-3 bg-muted/30 rounded-xl">
                                                    <p className="text-xs text-muted-foreground mb-1">Expected Yield</p>
                                                    <p className="font-bold text-foreground">
                                                        {yieldRecord.predicted_yield_kg ? `${yieldRecord.predicted_yield_kg.toLocaleString()} kg` : '—'}
                                                    </p>
                                                </div>
                                                <div className="text-center p-3 bg-muted/30 rounded-xl">
                                                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                                                    <p className="font-bold text-foreground">
                                                        {yieldRecord.prediction_confidence ? `${yieldRecord.prediction_confidence}%` : '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleLogHarvest(yieldRecord)}
                                                    className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                                >
                                                    <ClipboardCheck className="w-4 h-4" />
                                                    Log Harvest
                                                </button>
                                                <button className="py-2.5 px-4 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/70 transition-colors">
                                                    Details
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : activeTab === 'history' ? (
                            /* Harvest History */
                            <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
                                <div className="p-5 border-b border-border/50">
                                    <h3 className="font-semibold text-foreground">Harvest History</h3>
                                </div>
                                {harvestedYields.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No harvest records yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {harvestedYields.map(yieldRecord => (
                                            <div key={yieldRecord.id} className="p-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-amber-500/20 rounded-lg">
                                                            <Wheat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{yieldRecord.crop_type}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Harvested {formatDate(yieldRecord.harvest_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-foreground">
                                                            {yieldRecord.actual_yield_kg?.toLocaleString() || '—'} kg
                                                        </p>
                                                        {yieldRecord.harvest_quality && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Grade {yieldRecord.harvest_quality}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Comparison View */
                            <div className="space-y-4">
                                {/* Stats Summary */}
                                {stats && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="bg-card rounded-xl shadow-lg border border-border/50 p-4 text-center">
                                            <p className="text-xs text-muted-foreground mb-1">Total Harvests</p>
                                            <p className="text-2xl font-bold text-foreground">{stats.total_harvests}</p>
                                        </div>
                                        <div className="bg-card rounded-xl shadow-lg border border-border/50 p-4 text-center">
                                            <p className="text-xs text-muted-foreground mb-1">Avg Accuracy</p>
                                            <p className="text-2xl font-bold text-green-500">{stats.average_accuracy}%</p>
                                        </div>
                                        <div className="bg-card rounded-xl shadow-lg border border-border/50 p-4 text-center">
                                            <p className="text-xs text-muted-foreground mb-1">Exceeded Prediction</p>
                                            <p className="text-2xl font-bold text-green-500">{stats.harvests_exceeded_prediction}</p>
                                        </div>
                                        <div className="bg-card rounded-xl shadow-lg border border-border/50 p-4 text-center">
                                            <p className="text-xs text-muted-foreground mb-1">Below Prediction</p>
                                            <p className="text-2xl font-bold text-yellow-500">{stats.harvests_below_prediction}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Comparison List */}
                                <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
                                    <div className="p-5 border-b border-border/50">
                                        <h3 className="font-semibold text-foreground">Predicted vs Actual</h3>
                                    </div>
                                    {comparisons.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No comparison data available yet</p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Log your first harvest to see comparisons
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/50">
                                            {comparisons.map(comparison => (
                                                <div key={comparison.id} className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium text-foreground">{comparison.crop_type}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(comparison.harvest_date)}
                                                            </p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 ${comparison.performed_better ? 'text-green-500' : 'text-yellow-500'}`}>
                                                            {comparison.performed_better ? (
                                                                <TrendingUp className="w-4 h-4" />
                                                            ) : (
                                                                <TrendingDown className="w-4 h-4" />
                                                            )}
                                                            <span className="font-medium">
                                                                {comparison.performed_better ? '+' : ''}{comparison.difference_kg.toLocaleString()} kg
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-muted-foreground">
                                                            Predicted: <span className="text-foreground">{comparison.predicted_yield_kg.toLocaleString()} kg</span>
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Actual: <span className="text-foreground font-medium">{comparison.actual_yield_kg.toLocaleString()} kg</span>
                                                        </span>
                                                        <span className={`ml-auto font-medium ${comparison.accuracy_percent >= 80 ? 'text-green-500' : comparison.accuracy_percent >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                            {comparison.accuracy_percent}% accurate
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Current Prediction */}
                        <YieldPredictionCard cropType="Wheat" />

                        {/* Row Spacing Optimizer - ZERO COST YIELD BOOST! */}
                        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 rounded-2xl shadow-lg border-2 border-orange-300 dark:border-orange-700 p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-orange-500/20 rounded-xl">
                                    <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">🚀 Boost Your Yield!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Optimize row spacing for 20-40% higher yield
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Potential Gain</span>
                                    <span className="text-2xl font-bold text-orange-600">+37.8%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Based on ICAR research for optimal wheat spacing
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    // Scroll to spacing calculator or show modal
                                    document.getElementById('spacing-optimizer')?.scrollIntoView({
                                        behavior: 'smooth'
                                    });
                                }}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Target className="w-5 h-5" />
                                See How to Increase Yield
                            </button>

                            <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span>Zero cost - just better technique</span>
                                </div>
                            </div>
                        </div>

                        {/* Spacing Calculator - Full Component */}
                        <div id="spacing-optimizer">
                            <SpacingCalculator
                                cropType="Wheat"
                                farmSize={2.5}
                                soilFertility="medium"
                                farmEquipment="manual"
                            />
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <h3 className="font-semibold text-foreground">Tips for Better Yield</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    'Monitor soil moisture daily during flowering',
                                    'Apply fertilizer based on soil test results',
                                    'Control pests early to prevent yield loss',
                                    'Harvest at optimal moisture content'
                                ].map((tip, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-muted-foreground">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Log Harvest Modal */}
            {showLogModal && selectedYield && (
                <LogHarvestModal
                    yieldRecord={selectedYield}
                    onClose={() => {
                        setShowLogModal(false);
                        setSelectedYield(null);
                    }}
                    onSuccess={() => {
                        setShowLogModal(false);
                        setSelectedYield(null);
                        // Refresh data
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

// Log Harvest Modal Component
const LogHarvestModal: React.FC<{
    yieldRecord: YieldRecord;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ yieldRecord, onClose, onSuccess }) => {
    const [actualYield, setActualYield] = useState('');
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
    const [quality, setQuality] = useState('A');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actualYield) return;

        setLoading(true);
        try {
            await yieldService.logHarvest(
                yieldRecord.id,
                parseFloat(actualYield),
                harvestDate,
                quality,
                notes
            );
            onSuccess();
        } catch (error) {
            console.error('[LogHarvest] Error:', error);
            alert('Failed to log harvest. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-md">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Log Harvest</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Wheat className="w-5 h-5 text-green-600" />
                            <span className="font-medium">{yieldRecord.crop_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Predicted yield: {yieldRecord.predicted_yield_kg?.toLocaleString() || '—'} kg
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Actual Yield (kg)
                        </label>
                        <input
                            type="number"
                            value={actualYield}
                            onChange={(e) => setActualYield(e.target.value)}
                            placeholder="e.g., 4500"
                            className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Harvest Date
                        </label>
                        <input
                            type="date"
                            value={harvestDate}
                            onChange={(e) => setHarvestDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Quality Grade
                        </label>
                        <div className="flex gap-2">
                            {['A', 'B', 'C'].map(grade => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() => setQuality(grade)}
                                    className={`flex-1 py-2 rounded-xl font-medium transition-colors ${quality === grade
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground hover:bg-muted/70'
                                        }`}
                                >
                                    Grade {grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any observations about the harvest..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !actualYield}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Log Harvest
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default YieldTracker;
