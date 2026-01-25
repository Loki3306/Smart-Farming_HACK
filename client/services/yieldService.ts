/**
 * Yield Service - API client for crop yield prediction and tracking
 */

// Base URL for API calls
const API_BASE = '/api';

// Types
export interface YieldPredictionRequest {
    crop_type: string;
    soil_moisture: number;
    soil_ph: number;
    temperature: number;
    humidity: number;
    rainfall?: number;
    sunlight_hours?: number;
    irrigation_type?: string;
    fertilizer_type?: string;
    growing_days?: number;
    ndvi_index?: number;
    disease_status?: string;
}

export interface YieldImprovementTip {
    factor: string;
    current: string;
    optimal: string;
    action: string;
    potential_yield_gain: string;
    priority: 'high' | 'medium' | 'low';
}

export interface YieldPrediction {
    predicted_yield: number;
    confidence: number;
    yield_potential: number;
    unit: string;
    improvement_tips: YieldImprovementTip[];
    model_version: string;
    timestamp: string;
    source?: string;
}

export interface YieldRecord {
    id: string;
    farmer_id: string;
    farm_id?: string;
    crop_type: string;
    sowing_date?: string;
    expected_harvest_date?: string;
    predicted_yield_kg?: number;
    prediction_confidence?: number;
    actual_yield_kg?: number;
    harvest_date?: string;
    harvest_quality?: string;
    status: 'growing' | 'harvested' | 'failed' | 'abandoned';
    sensor_snapshot?: any;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface YieldComparison {
    id: string;
    crop_type: string;
    sowing_date: string;
    harvest_date: string;
    predicted_yield_kg: number;
    actual_yield_kg: number;
    difference_kg: number;
    accuracy_percent: number;
    performed_better: boolean;
}

export interface YieldBenchmark {
    region: string;
    crop_type: string;
    // API may return either format
    avg_yield_kg?: number;
    min_yield_kg?: number;
    max_yield_kg?: number;
    // Python API format
    avg_yield?: number;
    min_yield?: number;
    max_yield?: number;
}

export interface YieldOptimization {
    current_predicted_yield: number;
    potential_optimized_yield: number;
    total_potential_gain_percent: number;
    top_improvements: YieldImprovementTip[];
    regional_benchmark: YieldBenchmark;
}

// Yield Service
export const yieldService = {
    /**
     * Get yield prediction from ML model
     */
    async predictYield(data: YieldPredictionRequest): Promise<YieldPrediction> {
        const response = await fetch(`${API_BASE}/yields/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to get yield prediction: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get optimization tips for a crop
     */
    async getOptimizationTips(
        cropType: string,
        soilMoisture?: number,
        soilPh?: number,
        temperature?: number,
        humidity?: number
    ): Promise<YieldOptimization> {
        const params = new URLSearchParams();
        if (soilMoisture !== undefined) params.set('soil_moisture', String(soilMoisture));
        if (soilPh !== undefined) params.set('soil_ph', String(soilPh));
        if (temperature !== undefined) params.set('temperature', String(temperature));
        if (humidity !== undefined) params.set('humidity', String(humidity));

        const response = await fetch(`${API_BASE}/yields/optimize/${cropType}?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to get optimization tips: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get yield benchmarks for a crop type
     */
    async getBenchmarks(cropType: string, region?: string): Promise<{ benchmarks: YieldBenchmark[], source: string }> {
        const params = region ? `?region=${encodeURIComponent(region)}` : '';
        const response = await fetch(`${API_BASE}/yields/benchmark/${cropType}${params}`);

        if (!response.ok) {
            throw new Error(`Failed to get benchmarks: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get all yield records for a farmer
     */
    async getYields(farmerId: string, status?: string, limit?: number): Promise<YieldRecord[]> {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (limit) params.set('limit', String(limit));

        const response = await fetch(`${API_BASE}/yields/farmer/${farmerId}?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to get yields: ${response.statusText}`);
        }

        const data = await response.json();
        return data.yields || [];
    },

    /**
     * Get yield comparison data (predicted vs actual)
     */
    async getComparison(farmerId: string): Promise<{
        comparisons: YieldComparison[],
        stats: {
            total_harvests: number;
            average_accuracy: number;
            harvests_exceeded_prediction: number;
            harvests_below_prediction: number;
        }
    }> {
        const response = await fetch(`${API_BASE}/yields/compare/${farmerId}`);

        if (!response.ok) {
            throw new Error(`Failed to get comparison: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get yield history with analytics
     */
    async getHistory(farmerId: string, cropType?: string, limit?: number): Promise<{
        history: YieldRecord[],
        analytics: {
            total_harvests: number;
            by_crop: { [key: string]: any };
        }
    }> {
        const params = new URLSearchParams();
        if (cropType) params.set('crop_type', cropType);
        if (limit) params.set('limit', String(limit));

        const response = await fetch(`${API_BASE}/yields/history/${farmerId}?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to get history: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Create a new yield record
     */
    async createYieldRecord(data: {
        farmer_id: string;
        farm_id?: string;
        crop_type: string;
        sowing_date?: string;
        expected_harvest_date?: string;
        predicted_yield_kg?: number;
        sensor_snapshot?: any;
        notes?: string;
    }): Promise<{ yield: YieldRecord, prediction?: YieldPrediction }> {
        const response = await fetch(`${API_BASE}/yields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create yield record: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Log actual harvest yield
     */
    async logHarvest(
        yieldId: string,
        actualYieldKg: number,
        harvestDate?: string,
        harvestQuality?: string,
        notes?: string
    ): Promise<{ yield: YieldRecord, accuracy: number | null }> {
        const response = await fetch(`${API_BASE}/yields/${yieldId}/harvest`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                actual_yield_kg: actualYieldKg,
                harvest_date: harvestDate,
                harvest_quality: harvestQuality,
                notes,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to log harvest: ${response.statusText}`);
        }

        return response.json();
    },
};

export default yieldService;
