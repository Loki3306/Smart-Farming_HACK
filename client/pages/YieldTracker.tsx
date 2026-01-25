/**
 * YieldTracker Page - Bento Grid Redesign
 * Features: Dashboard-style view of crops, predictions, and analytics
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wheat, ArrowLeft, Plus, TrendingUp, TrendingDown, Calendar,
    BarChart3, Target, Check, X, Loader2, ChevronRight, Sparkles,
    ClipboardCheck, History, Scale, Sprout, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { yieldService, YieldRecord, YieldComparison as YieldComparisonType } from '../services/yieldService';
import { YieldPredictionCard } from '../components/yield/YieldPredictionCard';
import { SpacingCalculator } from '../components/spacing/SpacingCalculator';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const YieldTracker: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
            month: 'short'
        });
    };

    // Calculate days
    const calculateDays = (fromDate?: string) => {
        if (!fromDate) return null;
        const from = new Date(fromDate);
        const to = new Date();
        return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Handle log harvest
    const handleLogHarvest = (yieldRecord: YieldRecord) => {
        setSelectedYield(yieldRecord);
        setShowLogModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-stone-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <button onClick={() => navigate(-1)} className="hover:text-foreground transition-colors flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <span>/</span>
                            <span>Yield Tracker</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Wheat className="w-8 h-8 text-green-600" />
                            Yield Analytics
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Smart predictions and harvest tracking</p>
                    </div>

                    <div className="flex gap-2">
                        <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4 mr-2" /> New Crop
                        </Button>
                    </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(160px,auto)]">

                    {/* 1. Summary Stats (Top Left - Wide) */}
                    <Card className="col-span-1 md:col-span-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-100 dark:border-green-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Performance Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Total Harvests</p>
                                    <p className="text-2xl font-bold">{stats?.total_harvests || 0}</p>
                                </div>
                                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {stats?.average_accuracy || 0}%
                                    </p>
                                </div>
                                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Exceeded</p>
                                    <p className="text-2xl font-bold text-amber-500">
                                        {stats?.harvests_exceeded_prediction || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>



                    {/* 3. Prediction Highlight (Mid Left - Tall) */}
                    <div className="col-span-1 md:col-span-2">
                        <YieldPredictionCard cropType="Wheat" />
                    </div>

                    {/* 4. Tips (Mid Center) - Now taking remaining width */}
                    <Card className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-950/20 border-amber-100 flex flex-col justify-center">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Sparkles className="w-8 h-8 text-amber-500 flex-shrink-0" />
                                <div>
                                    <p className="text-base font-bold text-amber-800 dark:text-amber-400 mb-1">Yield Tip</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                                        Monitor soil moisture daily during flowering to prevent yield loss.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>



                    {/* 6. Spacing Optimizer Teaser (Bottom Right - Wide) */}
                    <div className="col-span-1 md:col-span-4">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 p-6 text-white shadow-lg h-full flex flex-col justify-center group cursor-pointer hover:shadow-xl transition-all"
                            onClick={() => document.getElementById('spacing-calculator')?.scrollIntoView({ behavior: 'smooth' })}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Target className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                                    <Sparkles className="w-3 h-3" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Free Yield Boost</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Optimize Row Spacing</h3>
                                <p className="text-white/90 text-sm max-w-sm mb-4">
                                    Using correct spacing can increase yield by up to 40% without any extra cost.
                                </p>
                                <Button size="sm" variant="secondary" className="shadow-lg">
                                    Open Calculator <ArrowUpRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 7. Comparison Chart (DataViz placeholder) */}
                    <Card className="col-span-1 md:col-span-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Scale className="w-4 h-4 text-muted-foreground" />
                                Predicted vs Actual Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 flex items-end gap-2 md:gap-4 px-2">
                                {comparisons.slice(0, 10).map((c, i) => (
                                    <TooltipProvider key={i}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex-1 flex flex-col items-center gap-1 group">
                                                    <div className="w-full flex items-end gap-1 h-32 justify-center relative">
                                                        {/* Prediction Bar (Ghost) */}
                                                        <div className="w-3 md:w-8 bg-muted rounded-t-sm absolute bottom-0 z-0" style={{ height: `${Math.min((c.predicted_yield_kg / Math.max(...comparisons.map(x => x.actual_yield_kg))) * 100, 100)}%` }}></div>
                                                        {/* Actual Bar */}
                                                        <div className={cn(
                                                            "w-3 md:w-8 rounded-t-sm z-10 transition-all group-hover:opacity-80",
                                                            c.actual_yield_kg >= c.predicted_yield_kg ? "bg-green-500" : "bg-amber-500"
                                                        )} style={{ height: `${Math.min((c.actual_yield_kg / Math.max(...comparisons.map(x => x.actual_yield_kg))) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{c.crop_type.slice(0, 3)}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-xs">
                                                    <p className="font-bold">{c.crop_type}</p>
                                                    <p>Actual: {c.actual_yield_kg}kg</p>
                                                    <p className="text-muted-foreground">Predicted: {c.predicted_yield_kg}kg</p>
                                                    <p className={c.actual_yield_kg >= c.predicted_yield_kg ? "text-green-500" : "text-amber-500"}>
                                                        {c.accuracy_percent}% accuracy
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                                {comparisons.length === 0 && (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                        No comparison data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 8. Full Calculator (Bottom) */}
                    <div id="spacing-calculator" className="col-span-1 md:col-span-4 mt-8 pt-8 border-t border-border">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Target className="w-6 h-6 text-primary" />
                                Spacing Optimizer
                            </h2>
                            <p className="text-muted-foreground">Calculate potential yield improvements based on farm geometry</p>
                        </div>
                        <SpacingCalculator
                            cropType="Wheat"
                            farmSize={2.5}
                            soilFertility="medium"
                            farmEquipment="manual"
                        />
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
                        navigate(0); // Refresh
                    }}
                />
            )}
        </div>
    );
};

// Log Harvest Modal Component (Simple version mainly for functionality)
const LogHarvestModal: React.FC<{
    yieldRecord: YieldRecord;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ yieldRecord, onClose, onSuccess }) => {
    const [actualYield, setActualYield] = useState('');
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
    const [quality, setQuality] = useState('A');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await yieldService.logHarvest(yieldRecord.id, parseFloat(actualYield), harvestDate, quality, '');
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <CardHeader className="px-0 pt-0">
                    <CardTitle>Log Harvest for {yieldRecord.crop_type}</CardTitle>
                    <CardDescription>Predicted: {yieldRecord.predicted_yield_kg} kg</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Actual Yield (kg)</label>
                        <input
                            type="number"
                            required
                            className="w-full p-2 border rounded-md"
                            value={actualYield}
                            onChange={e => setActualYield(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Date</label>
                        <input
                            type="date"
                            required
                            className="w-full p-2 border rounded-md"
                            value={harvestDate}
                            onChange={e => setHarvestDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Quality</label>
                        <div className="flex gap-2 mt-1">
                            {['A', 'B', 'C'].map(q => (
                                <Button
                                    key={q}
                                    type="button"
                                    variant={quality === q ? "default" : "outline"}
                                    onClick={() => setQuality(q)}
                                    className="flex-1"
                                >
                                    {q}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Save Log
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default YieldTracker;
