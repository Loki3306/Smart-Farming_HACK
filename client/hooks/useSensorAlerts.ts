import { useEffect, useRef, useCallback } from 'react';
import { useFarmContext } from '../context/FarmContext';
import { sendNotification } from '../services/NotificationService';
import { useToast } from './use-toast';

// Thresholds for triggering alerts
const THRESHOLDS = {
    moisture: {
        criticalLow: 20,
        low: 35,
        high: 85,
        criticalHigh: 95
    },
    npk: {
        nitrogen: { low: 80, criticalLow: 50 },
        phosphorus: { low: 30, criticalLow: 15 },
        potassium: { low: 60, criticalLow: 30 }
    },
    ph: {
        low: 5.5,
        high: 8.5
    }
};

// Cooldown period to prevent spam (5 minutes per alert type)
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export interface SensorAlert {
    id: string;
    type: 'alert' | 'irrigation' | 'crop';
    title: string;
    message: string;
    timestamp: Date;
    priority: 'high' | 'medium' | 'low';
    read: boolean;
}

// Store alerts in localStorage for persistence
const ALERTS_STORAGE_KEY = 'farm_sensor_alerts';

function getStoredAlerts(): SensorAlert[] {
    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
        if (stored) {
            const alerts = JSON.parse(stored);
            // Convert timestamp strings back to Date objects
            return alerts.map((a: any) => ({
                ...a,
                timestamp: new Date(a.timestamp)
            }));
        }
    } catch (e) {
        console.error('[SensorAlerts] Error reading stored alerts:', e);
    }
    return [];
}

function storeAlerts(alerts: SensorAlert[]) {
    try {
        // Keep only last 50 alerts
        const toStore = alerts.slice(-50);
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
        console.error('[SensorAlerts] Error storing alerts:', e);
    }
}

export function useSensorAlerts() {
    const { sensorData } = useFarmContext();
    const { toast } = useToast();
    const lastAlertTimes = useRef<Record<string, number>>({});

    const canSendAlert = useCallback((alertKey: string): boolean => {
        const lastTime = lastAlertTimes.current[alertKey] || 0;
        const now = Date.now();
        if (now - lastTime < ALERT_COOLDOWN_MS) {
            return false;
        }
        lastAlertTimes.current[alertKey] = now;
        return true;
    }, []);

    const addAlert = useCallback((alert: Omit<SensorAlert, 'id' | 'timestamp' | 'read'>) => {
        const newAlert: SensorAlert = {
            ...alert,
            id: `alert_${Date.now()}`,
            timestamp: new Date(),
            read: false
        };

        // Save to localStorage
        const existing = getStoredAlerts();
        storeAlerts([...existing, newAlert]);

        // Show browser notification
        sendNotification(alert.title, alert.message, {
            type: alert.type,
            enablePush: true,
            enableSound: true,
            enableVibration: alert.priority === 'high'
        });

        // Show toast for immediate feedback
        toast({
            title: alert.title,
            description: alert.message,
            variant: alert.priority === 'high' ? 'destructive' : 'default',
        });
    }, [toast]);

    useEffect(() => {
        if (!sensorData) return;

        const moisture = sensorData.soilMoisture;
        const nitrogen = sensorData.npk.nitrogen;
        const phosphorus = sensorData.npk.phosphorus;
        const potassium = sensorData.npk.potassium;
        const ph = sensorData.pH;

        // Check moisture levels
        if (moisture <= THRESHOLDS.moisture.criticalLow) {
            if (canSendAlert('moisture_critical_low')) {
                addAlert({
                    type: 'irrigation',
                    title: '🚨 Critical: Soil Moisture Dangerously Low!',
                    message: `Moisture at ${moisture.toFixed(1)}%! Immediate irrigation needed to prevent crop damage.`,
                    priority: 'high'
                });
            }
        } else if (moisture <= THRESHOLDS.moisture.low) {
            if (canSendAlert('moisture_low')) {
                addAlert({
                    type: 'irrigation',
                    title: '⚠️ Low Soil Moisture Warning',
                    message: `Soil moisture at ${moisture.toFixed(1)}%. Consider irrigating soon.`,
                    priority: 'medium'
                });
            }
        } else if (moisture >= THRESHOLDS.moisture.criticalHigh) {
            if (canSendAlert('moisture_critical_high')) {
                addAlert({
                    type: 'alert',
                    title: '🚨 Critical: Soil Too Wet!',
                    message: `Moisture at ${moisture.toFixed(1)}%! Risk of root rot and waterlogging.`,
                    priority: 'high'
                });
            }
        } else if (moisture >= THRESHOLDS.moisture.high) {
            if (canSendAlert('moisture_high')) {
                addAlert({
                    type: 'alert',
                    title: '⚠️ High Moisture Warning',
                    message: `Soil moisture at ${moisture.toFixed(1)}%. Monitor for overwatering.`,
                    priority: 'medium'
                });
            }
        }

        // Check nitrogen
        if (nitrogen <= THRESHOLDS.npk.nitrogen.criticalLow) {
            if (canSendAlert('nitrogen_critical')) {
                addAlert({
                    type: 'crop',
                    title: '🚨 Critical: Nitrogen Deficiency!',
                    message: `Nitrogen at ${nitrogen} mg/kg. Immediate fertilization required.`,
                    priority: 'high'
                });
            }
        } else if (nitrogen <= THRESHOLDS.npk.nitrogen.low) {
            if (canSendAlert('nitrogen_low')) {
                addAlert({
                    type: 'crop',
                    title: '⚠️ Low Nitrogen Levels',
                    message: `Nitrogen at ${nitrogen} mg/kg. Consider applying nitrogen fertilizer.`,
                    priority: 'medium'
                });
            }
        }

        // Check phosphorus
        if (phosphorus <= THRESHOLDS.npk.phosphorus.criticalLow) {
            if (canSendAlert('phosphorus_critical')) {
                addAlert({
                    type: 'crop',
                    title: '🚨 Critical: Phosphorus Deficiency!',
                    message: `Phosphorus at ${phosphorus} mg/kg. Root development may be affected.`,
                    priority: 'high'
                });
            }
        } else if (phosphorus <= THRESHOLDS.npk.phosphorus.low) {
            if (canSendAlert('phosphorus_low')) {
                addAlert({
                    type: 'crop',
                    title: '⚠️ Low Phosphorus Levels',
                    message: `Phosphorus at ${phosphorus} mg/kg. Consider applying phosphorus fertilizer.`,
                    priority: 'medium'
                });
            }
        }

        // Check potassium
        if (potassium <= THRESHOLDS.npk.potassium.criticalLow) {
            if (canSendAlert('potassium_critical')) {
                addAlert({
                    type: 'crop',
                    title: '🚨 Critical: Potassium Deficiency!',
                    message: `Potassium at ${potassium} mg/kg. Plant immunity may be compromised.`,
                    priority: 'high'
                });
            }
        } else if (potassium <= THRESHOLDS.npk.potassium.low) {
            if (canSendAlert('potassium_low')) {
                addAlert({
                    type: 'crop',
                    title: '⚠️ Low Potassium Levels',
                    message: `Potassium at ${potassium} mg/kg. Consider applying potassium fertilizer.`,
                    priority: 'medium'
                });
            }
        }

        // Check pH
        if (ph <= THRESHOLDS.ph.low) {
            if (canSendAlert('ph_low')) {
                addAlert({
                    type: 'alert',
                    title: '⚠️ Soil Too Acidic',
                    message: `pH at ${ph.toFixed(1)}. Consider applying lime to raise pH.`,
                    priority: 'medium'
                });
            }
        } else if (ph >= THRESHOLDS.ph.high) {
            if (canSendAlert('ph_high')) {
                addAlert({
                    type: 'alert',
                    title: '⚠️ Soil Too Alkaline',
                    message: `pH at ${ph.toFixed(1)}. Consider applying sulfur to lower pH.`,
                    priority: 'medium'
                });
            }
        }
    }, [sensorData, canSendAlert, addAlert]);

    return {
        getStoredAlerts,
        clearAlerts: () => localStorage.removeItem(ALERTS_STORAGE_KEY)
    };
}

export { storeAlerts };

export { getStoredAlerts };
