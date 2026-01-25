import { useState, useEffect, FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
    TrendingUp,
    Ruler,
    Download,
    Sparkles,
    ArrowRight,
    Info
} from "lucide-react";
import { SpacingGrid } from "./SpacingGrid.tsx";
import { generatePlantingGuidePDF } from "../../utils/spacingPdfGenerator";

interface SpacingCalculatorProps {
    cropType: string;
    farmSize: number;
    soilFertility?: 'low' | 'medium' | 'high';
    farmEquipment?: string;
}

interface OptimalSpacing {
    crop_type: string;
    optimal_row_spacing_cm: number;
    optimal_plant_spacing_cm: number;
    plants_per_hectare: number;
    expected_yield_kg_ha: number;
    yield_improvement_percent: number;
    baseline_spacing_cm: number;
    source: string;
    your_farm_details?: {
        farm_size_hectares: number;
        total_plants_needed: number;
        seed_requirement: any;
        estimated_total_yield_kg: number;
    };
}

interface Comparison {
    current_spacing_cm: number;
    current_yield_kg_ha: number;
    optimal_spacing_cm: number;
    optimal_yield_kg_ha: number;
    yield_increase_kg_ha: number;
    improvement_percent: number;
    recommendation: string;
    financial_impact?: {
        income_increase_per_hectare: number;
        total_income_increase: number;
        currency: string;
    };
}

export const SpacingCalculator: FC<SpacingCalculatorProps> = ({
    cropType,
    farmSize,
    soilFertility = 'medium',
    farmEquipment = 'manual'
}: SpacingCalculatorProps) => {
    const { toast } = useToast();

    const [currentSpacing, setCurrentSpacing] = useState<number>(25);
    const [optimalData, setOptimalData] = useState<OptimalSpacing | null>(null);
    const [comparison, setComparison] = useState<Comparison | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch optimal spacing on mount
    useEffect(() => {
        fetchOptimalSpacing();
    }, [cropType, soilFertility, farmEquipment]);

    // Fetch comparison when current spacing changes
    useEffect(() => {
        if (currentSpacing > 0) {
            fetchComparison();
        }
    }, [currentSpacing, cropType]);

    const fetchOptimalSpacing = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/spacing/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crop_type: cropType,
                    farm_size_hectares: farmSize,
                    soil_fertility_level: soilFertility,
                    farm_equipment: farmEquipment
                })
            });

            if (response.ok) {
                const data = await response.json();
                setOptimalData(data);
                setCurrentSpacing(data.baseline_spacing_cm || 25);
            }
        } catch (error) {
            console.error('Error fetching optimal spacing:', error);
            toast({
                title: "Error",
                description: "Could not fetch spacing recommendations",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchComparison = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/spacing/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crop_type: cropType,
                    current_spacing_cm: currentSpacing,
                    farm_size_hectares: farmSize
                })
            });

            if (response.ok) {
                const data = await response.json();
                setComparison(data);
            }
        } catch (error) {
            console.error('Error comparing spacings:', error);
        }
    };

    const handleDownloadGuide = async () => {
        if (!optimalData) return;

        try {
            const response = await fetch('http://localhost:8000/api/spacing/planting-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crop_type: cropType,
                    farm_size_hectares: farmSize,
                    row_spacing_cm: optimalData.optimal_row_spacing_cm,
                    plant_spacing_cm: optimalData.optimal_plant_spacing_cm,
                    farm_equipment: farmEquipment
                })
            });

            if (response.ok) {
                const guide = await response.json();

                // Generate PDF
                generatePlantingGuidePDF(guide);

                toast({
                    title: "📄 Guide Downloaded",
                    description: "Your planting guide has been downloaded as PDF!"
                });
            }
        } catch (error) {
            console.error('Error downloading guide:', error);
            toast({
                title: "Error",
                description: "Could not download planting guide",
                variant: "destructive"
            });
        }
    };




    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading spacing recommendations...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!optimalData) return null;

    return (
        <div className="w-full">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-[auto_auto_auto] gap-4">

                {/* Large Hero Card - Spans 4 columns, 2 rows */}
                <Card className="md:col-span-4 md:row-span-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-3xl flex items-center gap-3">
                                    <Ruler className="w-8 h-8 text-green-600" />
                                    Row Spacing Optimizer
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Zero-cost technique for {cropType} · Farm size: {farmSize} hectares
                                </p>
                            </div>
                            <Badge className="bg-green-600 text-white text-lg px-6 py-3">
                                +{optimalData.yield_improvement_percent}%
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Interactive Slider */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-medium">Your Current Spacing:</label>
                                <span className="text-3xl font-bold text-primary">{currentSpacing} cm</span>
                            </div>
                            <Slider
                                value={[currentSpacing]}
                                onValueChange={(value: number[]) => setCurrentSpacing(value[0])}
                                min={10}
                                max={100}
                                step={5}
                                className="w-full h-3"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>Dense (10cm)</span>
                                <span>Optimal</span>
                                <span>Wide (100cm)</span>
                            </div>
                        </div>

                        {/* Visual Grid */}
                        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-6">
                            <SpacingGrid
                                rowSpacing={currentSpacing}
                                plantSpacing={currentSpacing * 0.4}
                                size={280}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Optimal Spacing Card - Top Right */}
                <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Optimal for {cropType}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">Row</p>
                                <p className="text-2xl font-bold text-blue-600">{optimalData.optimal_row_spacing_cm}</p>
                                <p className="text-xs">cm</p>
                            </div>
                            <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">Plant</p>
                                <p className="text-2xl font-bold text-blue-600">{optimalData.optimal_plant_spacing_cm}</p>
                                <p className="text-xs">cm</p>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground italic border-l-2 border-blue-400 pl-3">
                            📚 {optimalData.source}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats Card - Middle Right */}
                <Card className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Your Farm</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">Plants</p>
                            <p className="text-xl font-bold">{optimalData.plants_per_hectare.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Yield</p>
                            <p className="text-xl font-bold">{optimalData.expected_yield_kg_ha.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Comparison Card - Wide Bottom */}
                {comparison && (
                    <Card className="md:col-span-4 border-2 border-primary/20 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Yield Comparison
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Current */}
                                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Current Practice</p>
                                    <p className="text-lg font-semibold">{comparison.current_spacing_cm} cm</p>
                                    <p className="text-2xl font-bold text-orange-600 mt-2">
                                        {comparison.current_yield_kg_ha.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">kg/ha</p>
                                </div>

                                {/* Arrow & Improvement */}
                                <div className="flex flex-col items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                    <ArrowRight className="w-8 h-8 text-green-600 mb-2" />
                                    <p className="text-3xl font-bold text-green-600">
                                        +{comparison.improvement_percent.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        +{comparison.yield_increase_kg_ha.toLocaleString()} kg/ha
                                    </p>
                                </div>

                                {/* Optimal */}
                                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center border-2 border-green-500">
                                    <p className="text-xs text-muted-foreground mb-1">Optimal ✨</p>
                                    <p className="text-lg font-semibold">{comparison.optimal_spacing_cm} cm</p>
                                    <p className="text-2xl font-bold text-green-600 mt-2">
                                        {comparison.optimal_yield_kg_ha.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">kg/ha</p>
                                </div>
                            </div>

                            {/* Financial Impact */}
                            {comparison.financial_impact && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                        <span>💰</span> Financial Impact
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Per Hectare</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                +₹{comparison.financial_impact.income_increase_per_hectare.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total ({farmSize} ha)</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                +₹{comparison.financial_impact.total_income_increase.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons Card */}
                <Card className="md:col-span-2 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Take Action</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full gap-2"
                            onClick={handleDownloadGuide}
                        >
                            <Download className="w-4 h-4" />
                            Download Guide
                        </Button>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-4 h-4" />
                            <span>Zero cost - just better technique!</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
