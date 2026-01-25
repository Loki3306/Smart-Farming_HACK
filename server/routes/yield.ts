/**
 * Yield Routes - API endpoints for crop yield prediction and tracking
 * Connects to Python FastAPI backend for ML predictions and Supabase for data storage
 */

import { Request, Response } from 'express';
import { supabase } from '../db/supabase';

// Python backend URL for ML predictions
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000';

// ============================================================================
// YIELD PREDICTION - Proxies to Python ML backend
// ============================================================================

/**
 * POST /api/yields/predict
 * Get yield prediction from ML model
 */
export const predictYield = async (req: Request, res: Response) => {
    try {
        const predictionData = req.body;

        // Validate required fields
        if (!predictionData.crop_type) {
            return res.status(400).json({ error: 'crop_type is required' });
        }

        // Call Python backend for ML prediction
        const response = await fetch(`${PYTHON_AI_URL}/api/yield/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop_type: predictionData.crop_type,
                soil_moisture: predictionData.soil_moisture || 35,
                soil_ph: predictionData.soil_ph || 6.5,
                temperature: predictionData.temperature || 25,
                humidity: predictionData.humidity || 65,
                rainfall: predictionData.rainfall || 150,
                sunlight_hours: predictionData.sunlight_hours || 7,
                irrigation_type: predictionData.irrigation_type || 'None',
                fertilizer_type: predictionData.fertilizer_type || 'Mixed',
                growing_days: predictionData.growing_days || 120,
                ndvi_index: predictionData.ndvi_index || 0.6,
                disease_status: predictionData.disease_status || 'None'
            })
        });

        if (!response.ok) {
            throw new Error(`Python API error: ${response.status}`);
        }

        const prediction = await response.json();
        res.json(prediction);

    } catch (error) {
        console.error('[Yield] Error predicting yield:', error);

        // Fallback prediction if Python backend is unavailable
        const fallbackPrediction = generateFallbackPrediction(req.body);
        res.json(fallbackPrediction);
    }
};

/**
 * GET /api/yields/optimize/:cropType
 * Get optimization tips for a crop
 */
export const getOptimizationTips = async (req: Request, res: Response) => {
    try {
        const { cropType } = req.params;
        const { soil_moisture, soil_ph, temperature, humidity } = req.query;

        const queryParams = new URLSearchParams({
            soil_moisture: (soil_moisture as string) || '35',
            soil_ph: (soil_ph as string) || '6.5',
            temperature: (temperature as string) || '25',
            humidity: (humidity as string) || '65'
        });

        const response = await fetch(
            `${PYTHON_AI_URL}/api/yield/optimize/${cropType}?${queryParams}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`Python API error: ${response.status}`);
        }

        const optimization = await response.json();
        res.json(optimization);

    } catch (error) {
        console.error('[Yield] Error getting optimization tips:', error);
        res.status(500).json({
            error: 'Failed to get optimization tips',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/yields/benchmark/:cropType
 * Get regional yield benchmarks
 */
export const getYieldBenchmark = async (req: Request, res: Response) => {
    try {
        const { cropType } = req.params;
        const { region } = req.query;

        // Try to get from database first
        const benchmarks = await supabase.from('yield_benchmarks')
            .select('*')
            .ilike('crop_type', cropType)
            .limit(5);

        if (benchmarks.data && benchmarks.data.length > 0) {
            res.json({
                benchmarks: benchmarks.data,
                source: 'database'
            });
        } else {
            // Fallback to Python API
            const response = await fetch(
                `${PYTHON_AI_URL}/api/yield/benchmark/${cropType}?region=${region || 'India'}`,
                { method: 'GET' }
            );

            if (response.ok) {
                const benchmark = await response.json();
                res.json({ benchmarks: [benchmark], source: 'ml_model' });
            } else {
                // Default benchmarks
                res.json({
                    benchmarks: [{
                        crop_type: cropType,
                        region: region || 'India',
                        avg_yield_kg: 4000,
                        min_yield_kg: 2500,
                        max_yield_kg: 6000
                    }],
                    source: 'default'
                });
            }
        }

    } catch (error) {
        console.error('[Yield] Error getting benchmark:', error);
        res.status(500).json({
            error: 'Failed to get yield benchmark',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


// ============================================================================
// YIELD TRACKING - CRUD operations for crop yield records
// ============================================================================

/**
 * GET /api/yields/farmer/:farmerId
 * Get all yield records for a farmer
 */
export const getYieldsByFarmer = async (req: Request, res: Response) => {
    try {
        const { farmerId } = req.params;
        const { status, limit } = req.query;

        let query = supabase.from('crop_yields')
            .select('*')
            .eq('farmer_id', farmerId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (limit) {
            query = query.limit(parseInt(limit as string));
        }

        const result = await query;

        if (result.error) {
            throw result.error;
        }

        res.json({ yields: result.data || [] });

    } catch (error) {
        console.error('[Yield] Error fetching yields:', error);
        res.status(500).json({
            error: 'Failed to fetch yield records',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/yields/:id
 * Get single yield record by ID
 */
export const getYieldById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await supabase.from('crop_yields')
            .select('*')
            .eq('id', id)
            .single();

        if (result.error) {
            throw result.error;
        }

        res.json({ yield: result.data });

    } catch (error) {
        console.error('[Yield] Error fetching yield:', error);
        res.status(500).json({
            error: 'Failed to fetch yield record',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/yields
 * Create new yield prediction record
 */
export const createYieldRecord = async (req: Request, res: Response) => {
    try {
        const yieldData = req.body;

        // Validate required fields
        if (!yieldData.farmer_id || !yieldData.crop_type) {
            return res.status(400).json({ error: 'farmer_id and crop_type are required' });
        }

        // Get prediction from ML model if sensor data provided
        let prediction = null;
        if (yieldData.sensor_snapshot) {
            try {
                const predResponse = await fetch(`${PYTHON_AI_URL}/api/yield/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        crop_type: yieldData.crop_type,
                        soil_moisture: yieldData.sensor_snapshot.soil_moisture,
                        soil_ph: yieldData.sensor_snapshot.soil_ph,
                        temperature: yieldData.sensor_snapshot.temperature,
                        humidity: yieldData.sensor_snapshot.humidity || 65,
                        rainfall: yieldData.sensor_snapshot.rainfall || 150
                    })
                });
                if (predResponse.ok) {
                    prediction = await predResponse.json();
                }
            } catch (e) {
                console.log('[Yield] Could not get ML prediction, using provided values');
            }
        }

        const insertData = {
            farmer_id: yieldData.farmer_id,
            farm_id: yieldData.farm_id || null,
            crop_type: yieldData.crop_type,
            sowing_date: yieldData.sowing_date || null,
            expected_harvest_date: yieldData.expected_harvest_date || null,
            predicted_yield_kg: prediction?.predicted_yield || yieldData.predicted_yield_kg || null,
            prediction_confidence: prediction?.confidence || yieldData.prediction_confidence || null,
            sensor_snapshot: yieldData.sensor_snapshot || null,
            status: 'growing',
            notes: yieldData.notes || null
        };

        const result = await supabase.from('crop_yields').insert([insertData]).select().single();

        if (result.error) {
            throw result.error;
        }

        res.status(201).json({ yield: result.data, prediction });

    } catch (error) {
        console.error('[Yield] Error creating yield record:', error);
        res.status(500).json({
            error: 'Failed to create yield record',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * PUT /api/yields/:id/harvest
 * Log actual harvest yield
 */
export const logHarvest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { actual_yield_kg, harvest_date, harvest_quality, notes } = req.body;

        if (!actual_yield_kg) {
            return res.status(400).json({ error: 'actual_yield_kg is required' });
        }

        const updateData = {
            actual_yield_kg,
            harvest_date: harvest_date || new Date().toISOString().split('T')[0],
            harvest_quality: harvest_quality || null,
            status: 'harvested',
            notes: notes || null,
            updated_at: new Date().toISOString()
        };

        const result = await supabase.from('crop_yields')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        // Calculate accuracy if we have predicted yield
        const yieldRecord = result.data;
        let accuracy = null;
        if (yieldRecord.predicted_yield_kg && yieldRecord.actual_yield_kg) {
            const diff = Math.abs(yieldRecord.predicted_yield_kg - yieldRecord.actual_yield_kg);
            accuracy = Math.max(0, 100 - (diff / yieldRecord.predicted_yield_kg * 100));
        }

        res.json({
            yield: yieldRecord,
            accuracy: accuracy ? Math.round(accuracy * 10) / 10 : null
        });

    } catch (error) {
        console.error('[Yield] Error logging harvest:', error);
        res.status(500).json({
            error: 'Failed to log harvest',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/yields/compare/:farmerId
 * Get predicted vs actual yield comparison
 */
export const getYieldComparison = async (req: Request, res: Response) => {
    try {
        const { farmerId } = req.params;

        // Get harvested crops with both predicted and actual values
        const result = await supabase.from('crop_yields')
            .select('*')
            .eq('farmer_id', farmerId)
            .eq('status', 'harvested')
            .not('predicted_yield_kg', 'is', null)
            .not('actual_yield_kg', 'is', null)
            .order('harvest_date', { ascending: false })
            .limit(20);

        if (result.error) {
            throw result.error;
        }

        const comparisons = (result.data || []).map((record: any) => {
            const diff = record.actual_yield_kg - record.predicted_yield_kg;
            const accuracy = Math.max(0, 100 - Math.abs(diff) / record.predicted_yield_kg * 100);

            return {
                id: record.id,
                crop_type: record.crop_type,
                sowing_date: record.sowing_date,
                harvest_date: record.harvest_date,
                predicted_yield_kg: record.predicted_yield_kg,
                actual_yield_kg: record.actual_yield_kg,
                difference_kg: Math.round(diff * 100) / 100,
                accuracy_percent: Math.round(accuracy * 10) / 10,
                performed_better: diff > 0
            };
        });

        // Calculate overall stats
        const totalRecords = comparisons.length;
        const avgAccuracy = totalRecords > 0
            ? comparisons.reduce((sum: number, c: any) => sum + c.accuracy_percent, 0) / totalRecords
            : 0;
        const betterThanPredicted = comparisons.filter((c: any) => c.performed_better).length;

        res.json({
            comparisons,
            stats: {
                total_harvests: totalRecords,
                average_accuracy: Math.round(avgAccuracy * 10) / 10,
                harvests_exceeded_prediction: betterThanPredicted,
                harvests_below_prediction: totalRecords - betterThanPredicted
            }
        });

    } catch (error) {
        console.error('[Yield] Error getting comparison:', error);
        res.status(500).json({
            error: 'Failed to get yield comparison',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/yields/history/:farmerId
 * Get yield history with analytics
 */
export const getYieldHistory = async (req: Request, res: Response) => {
    try {
        const { farmerId } = req.params;
        const { crop_type, year, limit } = req.query;

        let query = supabase.from('crop_yields')
            .select('*')
            .eq('farmer_id', farmerId)
            .eq('status', 'harvested')
            .order('harvest_date', { ascending: false });

        if (crop_type) {
            query = query.ilike('crop_type', crop_type as string);
        }

        if (limit) {
            query = query.limit(parseInt(limit as string));
        }

        const result = await query;

        if (result.error) {
            throw result.error;
        }

        const history = result.data || [];

        // Calculate analytics
        const byCrop: { [key: string]: any } = {};
        history.forEach((record: any) => {
            const crop = record.crop_type;
            if (!byCrop[crop]) {
                byCrop[crop] = {
                    count: 0,
                    total_yield: 0,
                    avg_yield: 0,
                    best_yield: 0,
                    worst_yield: Infinity
                };
            }
            byCrop[crop].count++;
            byCrop[crop].total_yield += record.actual_yield_kg;
            byCrop[crop].best_yield = Math.max(byCrop[crop].best_yield, record.actual_yield_kg);
            byCrop[crop].worst_yield = Math.min(byCrop[crop].worst_yield, record.actual_yield_kg);
        });

        // Calculate averages
        Object.keys(byCrop).forEach(crop => {
            byCrop[crop].avg_yield = Math.round(byCrop[crop].total_yield / byCrop[crop].count);
            if (byCrop[crop].worst_yield === Infinity) byCrop[crop].worst_yield = 0;
        });

        res.json({
            history,
            analytics: {
                total_harvests: history.length,
                by_crop: byCrop
            }
        });

    } catch (error) {
        console.error('[Yield] Error getting history:', error);
        res.status(500).json({
            error: 'Failed to get yield history',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate fallback prediction when Python backend is unavailable
 */
function generateFallbackPrediction(data: any) {
    const cropBenchmarks: { [key: string]: { avg: number, min: number, max: number } } = {
        wheat: { avg: 3500, min: 2000, max: 6000 },
        rice: { avg: 4000, min: 2500, max: 6500 },
        maize: { avg: 4500, min: 2000, max: 7000 },
        cotton: { avg: 3000, min: 1500, max: 5500 },
        soybean: { avg: 3500, min: 1500, max: 6000 }
    };

    const cropType = (data.crop_type || 'wheat').toLowerCase();
    const benchmark = cropBenchmarks[cropType] || cropBenchmarks.wheat;

    // Simple heuristic-based prediction
    let baseYield = benchmark.avg;

    // Adjust based on conditions
    const moisture = data.soil_moisture || 35;
    const ph = data.soil_ph || 6.5;
    const temp = data.temperature || 25;

    if (moisture >= 25 && moisture <= 45) baseYield *= 1.1;
    else if (moisture < 15 || moisture > 55) baseYield *= 0.8;

    if (ph >= 6.0 && ph <= 7.5) baseYield *= 1.05;
    else if (ph < 5.5 || ph > 8.0) baseYield *= 0.85;

    if (temp >= 20 && temp <= 30) baseYield *= 1.05;
    else if (temp > 38 || temp < 10) baseYield *= 0.75;

    const yieldPotential = (baseYield - benchmark.min) / (benchmark.max - benchmark.min) * 100;

    return {
        predicted_yield: Math.round(baseYield),
        confidence: 65,
        yield_potential: Math.round(Math.max(0, Math.min(100, yieldPotential))),
        unit: 'kg/hectare',
        improvement_tips: [
            {
                factor: 'ML Model',
                current: 'Fallback mode',
                optimal: 'Full ML prediction',
                action: 'Start Python backend for accurate predictions',
                potential_yield_gain: '+15%',
                priority: 'high'
            }
        ],
        model_version: 'fallback_1.0',
        timestamp: new Date().toISOString(),
        source: 'fallback'
    };
}
