import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Droplets, Leaf, FlaskConical, Beaker, Activity } from 'lucide-react';
import { useFarmContext } from '../../context/FarmContext';
import { useCropThresholds, CropThresholds } from '../../hooks/useCropThresholds';

interface SystemStatusChartProps {
    isOpen: boolean;
    onClose: () => void;
}

// Progress bar component for visualizing value vs threshold
const ThresholdBar: React.FC<{
    label: string;
    icon: React.ReactNode;
    value: number;
    range: [number, number];
    unit?: string;
    maxDisplay?: number;
}> = ({ label, icon, value, range, unit = '', maxDisplay = 150 }) => {
    const [min, max] = range;
    const percentage = Math.min((value / maxDisplay) * 100, 100);
    const minPercentage = (min / maxDisplay) * 100;
    const maxPercentage = (max / maxDisplay) * 100;

    // Determine status
    let status: 'optimal' | 'warning' | 'critical';
    let statusColor: string;
    let barColor: string;

    if (value >= min && value <= max * 1.2) {
        status = 'optimal';
        statusColor = 'text-green-600 dark:text-green-400';
        barColor = 'bg-green-500';
    } else if (value >= min * 0.7 || value <= max * 1.5) {
        status = 'warning';
        statusColor = 'text-amber-600 dark:text-amber-400';
        barColor = 'bg-amber-500';
    } else {
        status = 'critical';
        statusColor = 'text-red-600 dark:text-red-400';
        barColor = 'bg-red-500';
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="font-medium text-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
                    <span className="text-xs text-muted-foreground">[{min}-{max}]</span>
                    <span className={`text-xs font-semibold ${statusColor}`}>
                        {status === 'optimal' ? '✓' : status === 'warning' ? '⚠' : '🚨'}
                    </span>
                </div>
            </div>

            {/* Bar visualization */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                {/* Optimal range indicator */}
                <div
                    className="absolute h-full bg-green-200 dark:bg-green-900/50"
                    style={{
                        left: `${minPercentage}%`,
                        width: `${maxPercentage - minPercentage}%`
                    }}
                />
                {/* Current value bar */}
                <motion.div
                    className={`absolute h-full ${barColor} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {/* Min/Max markers */}
                <div
                    className="absolute h-full w-0.5 bg-green-600 dark:bg-green-400"
                    style={{ left: `${minPercentage}%` }}
                />
                <div
                    className="absolute h-full w-0.5 bg-green-600 dark:bg-green-400"
                    style={{ left: `${maxPercentage}%` }}
                />
            </div>
        </div>
    );
};

export const SystemStatusChart: React.FC<SystemStatusChartProps> = ({ isOpen, onClose }) => {
    const { sensorData, systemStatus } = useFarmContext();
    const { thresholds, cropName, loading } = useCropThresholds();

    const isAutonomous = systemStatus?.isAutonomous ?? false;

    // Calculate what action would trigger
    const getActionStatus = () => {
        if (!sensorData) return { message: 'Waiting for sensor data...', icon: '⏳' };

        const moisture = sensorData.soilMoisture;
        const moistureMin = thresholds.moisture[0];
        const nitrogen = sensorData.npk.nitrogen;
        const nitrogenMin = thresholds.nitrogen[0];

        if (!isAutonomous) {
            return {
                message: 'Manual mode - Autonomous actions disabled',
                icon: '🔒',
                subtext: 'Switch to Autonomous in Control Center to enable AI decisions'
            };
        }

        if (moisture < moistureMin) {
            return {
                message: `Irrigation triggered! Moisture ${moisture.toFixed(1)}% < ${moistureMin}%`,
                icon: '💧',
                subtext: 'Water pump will activate automatically'
            };
        }

        if (nitrogen < nitrogenMin) {
            return {
                message: `Fertilization triggered! Nitrogen ${nitrogen.toFixed(0)} < ${nitrogenMin}`,
                icon: '🌿',
                subtext: 'Fertilizer will be applied automatically'
            };
        }

        // Calculate when next action might trigger
        const moistureBuffer = moisture - moistureMin;
        if (moistureBuffer < 10) {
            return {
                message: `Irrigation may trigger soon (moisture at ${moisture.toFixed(1)}%)`,
                icon: '⚠️',
                subtext: `Will trigger when moisture drops below ${moistureMin}%`
            };
        }

        return {
            message: 'All values optimal - No action needed',
            icon: '✅',
            subtext: 'System is monitoring and will act when needed'
        };
    };

    const actionStatus = getActionStatus();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-border/30 bg-gradient-to-r from-primary/10 to-primary/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Brain className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground">AI System Status</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Crop: {cropName} • {isAutonomous ? '🤖 Autonomous' : '🔒 Manual'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading thresholds...
                                    </div>
                                ) : (
                                    <>
                                        {/* Threshold Bars */}
                                        <div className="space-y-4">
                                            <ThresholdBar
                                                label="Soil Moisture"
                                                icon={<Droplets className="w-4 h-4 text-blue-500" />}
                                                value={sensorData?.soilMoisture ?? 0}
                                                range={thresholds.moisture}
                                                unit="%"
                                                maxDisplay={100}
                                            />

                                            <ThresholdBar
                                                label="Nitrogen (N)"
                                                icon={<Leaf className="w-4 h-4 text-green-500" />}
                                                value={sensorData?.npk.nitrogen ?? 0}
                                                range={thresholds.nitrogen}
                                                unit=""
                                                maxDisplay={200}
                                            />

                                            <ThresholdBar
                                                label="Phosphorus (P)"
                                                icon={<FlaskConical className="w-4 h-4 text-amber-500" />}
                                                value={sensorData?.npk.phosphorus ?? 0}
                                                range={thresholds.phosphorus}
                                                unit=""
                                                maxDisplay={100}
                                            />

                                            <ThresholdBar
                                                label="Potassium (K)"
                                                icon={<Beaker className="w-4 h-4 text-orange-500" />}
                                                value={sensorData?.npk.potassium ?? 0}
                                                range={thresholds.potassium}
                                                unit=""
                                                maxDisplay={150}
                                            />

                                            <ThresholdBar
                                                label="pH Level"
                                                icon={<Activity className="w-4 h-4 text-purple-500" />}
                                                value={sensorData?.pH ?? 7}
                                                range={thresholds.ph}
                                                unit=""
                                                maxDisplay={14}
                                            />
                                        </div>

                                        {/* Action Status */}
                                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{actionStatus.icon}</span>
                                                <div>
                                                    <p className="font-semibold text-foreground">{actionStatus.message}</p>
                                                    {actionStatus.subtext && (
                                                        <p className="text-xs text-muted-foreground mt-1">{actionStatus.subtext}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Legend */}
                                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/50" />
                                                <span>Optimal Range</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded bg-green-600" />
                                                <span>Threshold</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
