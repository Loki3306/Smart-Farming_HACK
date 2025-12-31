import { useState, useEffect } from 'react';
import cropProfilesData from '../../shared/crop_profiles.json';

// Type for crop profile thresholds
export interface CropThresholds {
    moisture: [number, number];
    nitrogen: [number, number];
    phosphorus: [number, number];
    potassium: [number, number];
    ph: [number, number];
}

// Default thresholds (generic crop)
export const DEFAULT_THRESHOLDS: CropThresholds = {
    moisture: [50, 70],
    nitrogen: [70, 130],
    phosphorus: [35, 65],
    potassium: [70, 120],
    ph: [6.0, 7.0],
};

// Get crop thresholds from crop_profiles.json
export function getCropThresholds(cropName: string): CropThresholds {
    const crops = (cropProfilesData as any).crops || {};
    const cropKey = cropName?.toLowerCase().replace(/\s+/g, '') || 'default';

    const cropData = crops[cropKey]?.overall;
    if (!cropData) {
        return DEFAULT_THRESHOLDS;
    }

    return {
        moisture: cropData.moistureOptimal || DEFAULT_THRESHOLDS.moisture,
        nitrogen: cropData.npkOptimal?.nitrogen || DEFAULT_THRESHOLDS.nitrogen,
        phosphorus: cropData.npkOptimal?.phosphorus || DEFAULT_THRESHOLDS.phosphorus,
        potassium: cropData.npkOptimal?.potassium || DEFAULT_THRESHOLDS.potassium,
        ph: cropData.phOptimal || DEFAULT_THRESHOLDS.ph,
    };
}

export interface UseCropThresholdsResult {
    thresholds: CropThresholds;
    cropName: string;
    loading: boolean;
}

/**
 * Hook to fetch and provide crop-specific thresholds
 * Fetches from farm_settings based on current farm
 */
export function useCropThresholds(): UseCropThresholdsResult {
    const [thresholds, setThresholds] = useState<CropThresholds>(DEFAULT_THRESHOLDS);
    const [cropName, setCropName] = useState<string>("General");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCropSettings() {
            try {
                const farmId = localStorage.getItem("current_farm_id");
                if (!farmId) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/farm_settings?farmer_id=eq.${farmId}&select=crop`,
                    {
                        headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data?.[0]?.crop) {
                        const crop = data[0].crop;
                        setCropName(crop);
                        setThresholds(getCropThresholds(crop));
                    }
                }
            } catch (e) {
                console.warn('[useCropThresholds] Failed to fetch crop settings:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchCropSettings();
    }, []);

    return { thresholds, cropName, loading };
}
