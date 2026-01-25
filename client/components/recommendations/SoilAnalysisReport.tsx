import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Leaf,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertTriangle,
    Download,
    BarChart3
} from "lucide-react";

interface SoilData {
    N: number;
    P: number;
    K: number;
    pH?: number;
    moisture?: number;
}

interface NutrientGaps {
    N: number;
    P: number;
    K: number;
}

interface SoilAnalysisReportProps {
    soilData: SoilData;
    nutrientGaps: NutrientGaps;
    cropType: string;
    farmSize: number;
    totalCost: number;
    yieldImprovement: number;
    onDownloadPDF?: () => void;
}

export const SoilAnalysisReport: React.FC<SoilAnalysisReportProps> = ({
    soilData,
    nutrientGaps,
    cropType,
    farmSize,
    totalCost,
    yieldImprovement,
    onDownloadPDF
}) => {
    // Nutrient status evaluation
    const getNutrientStatus = (nutrient: keyof NutrientGaps) => {
        const gap = nutrientGaps[nutrient];
        if (gap === 0) return { status: 'Optimal', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800' };
        if (gap < 20) return { status: 'Low', icon: TrendingDown, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800' };
        return { status: 'Very Low', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' };
    };

    const nutrients = [
        { key: 'N' as const, name: 'Nitrogen', current: soilData.N },
        { key: 'P' as const, name: 'Phosphorus', current: soilData.P },
        { key: 'K' as const, name: 'Potassium', current: soilData.K }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Leaf className="w-6 h-6 text-primary" />
                            Soil Analysis Report
                        </CardTitle>
                        <Button onClick={onDownloadPDF} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Farm Details */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Crop Type</p>
                            <p className="text-lg font-semibold capitalize">{cropType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Farm Size</p>
                            <p className="text-lg font-semibold">{farmSize} hectares</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Investment</p>
                            <p className="text-lg font-semibold text-primary">₹{totalCost.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Expected Improvement</p>
                            <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {yieldImprovement}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Current Soil Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Current Soil Status (Sensor Data)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {nutrients.map(({ key, name, current }) => {
                        const status = getNutrientStatus(key);
                        const StatusIcon = status.icon;
                        const gap = nutrientGaps[key];

                        return (
                            <div
                                key={key}
                                className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                                        <span className="font-semibold">{name} ({key})</span>
                                    </div>
                                    <Badge variant="outline" className={status.color}>
                                        {status.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Current Level</p>
                                        <p className="text-lg font-bold">{current} kg/ha</p>
                                    </div>
                                    {gap > 0 && (
                                        <>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Deficiency</p>
                                                <p className="text-lg font-bold text-red-600">-{gap} kg/ha</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total Needed</p>
                                                <p className="text-lg font-bold text-primary">{(gap * farmSize).toFixed(1)} kg</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3">
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${gap === 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${Math.min((current / (current + gap)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* pH and Moisture (if available) */}
                    {(soilData.pH || soilData.moisture) && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            {soilData.pH && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-muted-foreground">Soil pH</p>
                                    <p className="text-xl font-bold text-blue-600">{soilData.pH.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {soilData.pH >= 6.0 && soilData.pH <= 7.5 ? '✅ Optimal' : '⚠️ Needs adjustment'}
                                    </p>
                                </div>
                            )}
                            {soilData.moisture && (
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                    <p className="text-sm text-muted-foreground">Soil Moisture</p>
                                    <p className="text-xl font-bold text-cyan-600">{soilData.moisture}%</p>
                                    <p className="text-xs text-muted-foreground">
                                        {soilData.moisture >= 40 && soilData.moisture <= 80 ? '✅ Good' : '⚠️ Check irrigation'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Alert */}
            <Alert className="border-l-4 border-l-primary">
                <Leaf className="h-4 w-4" />
                <AlertDescription>
                    <p className="font-semibold mb-1">Recommendation Summary</p>
                    <p className="text-sm">
                        Your soil analysis shows deficiencies in{' '}
                        {Object.entries(nutrientGaps)
                            .filter(([_, gap]) => gap > 0)
                            .map(([nutrient]) => nutrient)
                            .join(', ') || 'no nutrients'}.
                        {' '}With proper fertilization, you can expect approximately{' '}
                        <span className="font-semibold text-primary">{yieldImprovement}% yield improvement</span>.
                        Total investment: <span className="font-semibold">₹{totalCost.toFixed(2)}</span>
                    </p>
                </AlertDescription>
            </Alert>
        </div>
    );
};
