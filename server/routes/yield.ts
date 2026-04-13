/**
 * Yield Routes - API endpoints for crop yield prediction and tracking
 * Connects to Python FastAPI backend for ML predictions and Neon for data storage
 */

import { Request, Response } from "express";
import { query } from "../db/neon.js";

// Python backend URL for ML predictions
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

// ============================================================================
// YIELD PREDICTION - Proxies to Python ML backend
// ============================================================================

/**
 * POST /api/yields/predict
 */
export const predictYield = async (req: Request, res: Response) => {
  try {
    const predictionData = req.body;
    if (!predictionData.crop_type) {
      return res.status(400).json({ error: "crop_type is required" });
    }

    const response = await fetch(`${PYTHON_AI_URL}/api/yield/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crop_type: predictionData.crop_type,
        soil_moisture: predictionData.soil_moisture || 35,
        soil_ph: predictionData.soil_ph || 6.5,
        temperature: predictionData.temperature || 25,
        humidity: predictionData.humidity || 65,
        rainfall: predictionData.rainfall || 150,
        sunlight_hours: predictionData.sunlight_hours || 7,
        irrigation_type: predictionData.irrigation_type || "None",
        fertilizer_type: predictionData.fertilizer_type || "Mixed",
        growing_days: predictionData.growing_days || 120,
        ndvi_index: predictionData.ndvi_index || 0.6,
        disease_status: predictionData.disease_status || "None",
      }),
    });

    if (!response.ok) throw new Error(`Python API error: ${response.status}`);

    const prediction = await response.json();
    res.json(prediction);
  } catch (error) {
    console.error("[Yield] Error predicting yield:", error);
    res.json(generateFallbackPrediction(req.body));
  }
};

/**
 * GET /api/yields/optimize/:cropType
 */
export const getOptimizationTips = async (req: Request, res: Response) => {
  try {
    const { cropType } = req.params;
    const { soil_moisture, soil_ph, temperature, humidity } = req.query;

    const queryParams = new URLSearchParams({
      soil_moisture: (soil_moisture as string) || "35",
      soil_ph: (soil_ph as string) || "6.5",
      temperature: (temperature as string) || "25",
      humidity: (humidity as string) || "65",
    });

    const response = await fetch(
      `${PYTHON_AI_URL}/api/yield/optimize/${cropType}?${queryParams}`,
      { method: "GET" },
    );

    if (!response.ok) throw new Error(`Python API error: ${response.status}`);

    res.json(await response.json());
  } catch (error) {
    console.error("[Yield] Error getting optimization tips:", error);
    res.status(500).json({
      error: "Failed to get optimization tips",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/yields/benchmark/:cropType
 */
export const getYieldBenchmark = async (req: Request, res: Response) => {
  try {
    const { cropType } = req.params;
    const { region } = req.query;

    const benchmarks = await query(
      `SELECT * FROM yield_benchmarks WHERE crop_type ILIKE $1 LIMIT 5`,
      [cropType as string],
    );

    if (benchmarks.rows.length > 0) {
      return res.json({ benchmarks: benchmarks.rows, source: "database" });
    }

    // Fallback to Python API
    try {
      const response = await fetch(
        `${PYTHON_AI_URL}/api/yield/benchmark/${cropType}?region=${region || "India"}`,
        { method: "GET" },
      );
      if (response.ok) {
        const benchmark = await response.json();
        return res.json({ benchmarks: [benchmark], source: "ml_model" });
      }
    } catch (e) { /* ignore */ }

    res.json({
      benchmarks: [{
        crop_type: cropType, region: region || "India",
        avg_yield_kg: 4000, min_yield_kg: 2500, max_yield_kg: 6000,
      }],
      source: "default",
    });
  } catch (error) {
    console.error("[Yield] Error getting benchmark:", error);
    res.status(500).json({ error: "Failed to get yield benchmark", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * GET /api/yields/farmer/:farmerId
 */
export const getYieldsByFarmer = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;
    const { status, limit } = req.query;

    const conditions = [`farmer_id = $1`];
    const values: any[] = [farmerId];
    let idx = 2;

    if (status) { conditions.push(`status = $${idx++}`); values.push(status); }

    let sql = `SELECT * FROM crop_yields WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
    if (limit) { sql += ` LIMIT $${idx++}`; values.push(parseInt(limit as string)); }

    const result = await query(sql, values);
    res.json({ yields: result.rows });
  } catch (error) {
    console.error("[Yield] Error fetching yields:", error);
    res.status(500).json({ error: "Failed to fetch yield records", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * GET /api/yields/:id
 */
export const getYieldById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM crop_yields WHERE id = $1`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Yield record not found" });
    res.json({ yield: result.rows[0] });
  } catch (error) {
    console.error("[Yield] Error fetching yield:", error);
    res.status(500).json({ error: "Failed to fetch yield record", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * POST /api/yields
 */
export const createYieldRecord = async (req: Request, res: Response) => {
  try {
    const yieldData = req.body;
    if (!yieldData.farmer_id || !yieldData.crop_type) {
      return res.status(400).json({ error: "farmer_id and crop_type are required" });
    }

    let prediction = null;
    if (yieldData.sensor_snapshot) {
      try {
        const predResponse = await fetch(`${PYTHON_AI_URL}/api/yield/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop_type: yieldData.crop_type,
            soil_moisture: yieldData.sensor_snapshot.soil_moisture,
            soil_ph: yieldData.sensor_snapshot.soil_ph,
            temperature: yieldData.sensor_snapshot.temperature,
            humidity: yieldData.sensor_snapshot.humidity || 65,
            rainfall: yieldData.sensor_snapshot.rainfall || 150,
          }),
        });
        if (predResponse.ok) prediction = await predResponse.json();
      } catch (e) { /* ignore */ }
    }

    const result = await query(
      `INSERT INTO crop_yields
         (farmer_id, farm_id, crop_type, sowing_date, expected_harvest_date,
          predicted_yield_kg, prediction_confidence, sensor_snapshot, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'growing',$9)
       RETURNING *`,
      [
        yieldData.farmer_id, yieldData.farm_id || null, yieldData.crop_type,
        yieldData.sowing_date || null, yieldData.expected_harvest_date || null,
        prediction?.predicted_yield || yieldData.predicted_yield_kg || null,
        prediction?.confidence || yieldData.prediction_confidence || null,
        yieldData.sensor_snapshot ? JSON.stringify(yieldData.sensor_snapshot) : null,
        yieldData.notes || null,
      ],
    );

    res.status(201).json({ yield: result.rows[0], prediction });
  } catch (error) {
    console.error("[Yield] Error creating yield record:", error);
    res.status(500).json({ error: "Failed to create yield record", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * PUT /api/yields/:id/harvest
 */
export const logHarvest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actual_yield_kg, harvest_date, harvest_quality, notes } = req.body;

    if (!actual_yield_kg) return res.status(400).json({ error: "actual_yield_kg is required" });

    const result = await query(
      `UPDATE crop_yields
       SET actual_yield_kg=$1, harvest_date=$2, harvest_quality=$3,
           status='harvested', notes=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [
        actual_yield_kg,
        harvest_date || new Date().toISOString().split("T")[0],
        harvest_quality || null,
        notes || null,
        id,
      ],
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Yield record not found" });

    const yr = result.rows[0];
    let accuracy = null;
    if (yr.predicted_yield_kg && yr.actual_yield_kg) {
      const diff = Math.abs(yr.predicted_yield_kg - yr.actual_yield_kg);
      accuracy = Math.max(0, 100 - (diff / yr.predicted_yield_kg) * 100);
    }

    res.json({ yield: yr, accuracy: accuracy ? Math.round(accuracy * 10) / 10 : null });
  } catch (error) {
    console.error("[Yield] Error logging harvest:", error);
    res.status(500).json({ error: "Failed to log harvest", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * GET /api/yields/compare/:farmerId
 */
export const getYieldComparison = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;

    const result = await query(
      `SELECT * FROM crop_yields
       WHERE farmer_id = $1 AND status = 'harvested'
         AND predicted_yield_kg IS NOT NULL AND actual_yield_kg IS NOT NULL
       ORDER BY harvest_date DESC LIMIT 20`,
      [farmerId],
    );

    const comparisons = result.rows.map((record: any) => {
      const diff = record.actual_yield_kg - record.predicted_yield_kg;
      const accuracy = Math.max(0, 100 - (Math.abs(diff) / record.predicted_yield_kg) * 100);
      return {
        id: record.id, crop_type: record.crop_type,
        sowing_date: record.sowing_date, harvest_date: record.harvest_date,
        predicted_yield_kg: record.predicted_yield_kg, actual_yield_kg: record.actual_yield_kg,
        difference_kg: Math.round(diff * 100) / 100,
        accuracy_percent: Math.round(accuracy * 10) / 10,
        performed_better: diff > 0,
      };
    });

    const avgAccuracy = comparisons.length > 0
      ? comparisons.reduce((s, c) => s + c.accuracy_percent, 0) / comparisons.length
      : 0;

    res.json({
      comparisons,
      stats: {
        total_harvests: comparisons.length,
        average_accuracy: Math.round(avgAccuracy * 10) / 10,
        harvests_exceeded_prediction: comparisons.filter((c) => c.performed_better).length,
        harvests_below_prediction: comparisons.filter((c) => !c.performed_better).length,
      },
    });
  } catch (error) {
    console.error("[Yield] Error getting comparison:", error);
    res.status(500).json({ error: "Failed to get yield comparison", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

/**
 * GET /api/yields/history/:farmerId
 */
export const getYieldHistory = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;
    const { crop_type, limit } = req.query;

    const conditions = [`farmer_id = $1`, `status = 'harvested'`];
    const values: any[] = [farmerId];
    let idx = 2;

    if (crop_type) { conditions.push(`crop_type ILIKE $${idx++}`); values.push(crop_type); }

    let sql = `SELECT * FROM crop_yields WHERE ${conditions.join(" AND ")} ORDER BY harvest_date DESC`;
    if (limit) { sql += ` LIMIT $${idx++}`; values.push(parseInt(limit as string)); }

    const result = await query(sql, values);
    const history = result.rows;

    // Aggregate analytics
    const byCrop: Record<string, any> = {};
    history.forEach((record: any) => {
      const crop = record.crop_type;
      if (!byCrop[crop]) byCrop[crop] = { count: 0, total_yield: 0, avg_yield: 0, best_yield: 0, worst_yield: Infinity };
      byCrop[crop].count++;
      byCrop[crop].total_yield += record.actual_yield_kg;
      byCrop[crop].best_yield = Math.max(byCrop[crop].best_yield, record.actual_yield_kg);
      byCrop[crop].worst_yield = Math.min(byCrop[crop].worst_yield, record.actual_yield_kg);
    });
    Object.keys(byCrop).forEach((crop) => {
      byCrop[crop].avg_yield = Math.round(byCrop[crop].total_yield / byCrop[crop].count);
      if (byCrop[crop].worst_yield === Infinity) byCrop[crop].worst_yield = 0;
    });

    res.json({ history, analytics: { total_harvests: history.length, by_crop: byCrop } });
  } catch (error) {
    console.error("[Yield] Error getting history:", error);
    res.status(500).json({ error: "Failed to get yield history", details: error instanceof Error ? error.message : "Unknown error" });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateFallbackPrediction(data: any) {
  const cropBenchmarks: { [key: string]: { avg: number; min: number; max: number } } = {
    wheat: { avg: 3500, min: 2000, max: 6000 },
    rice: { avg: 4000, min: 2500, max: 6500 },
    maize: { avg: 4500, min: 2000, max: 7000 },
    cotton: { avg: 3000, min: 1500, max: 5500 },
    soybean: { avg: 3500, min: 1500, max: 6000 },
  };
  const cropType = (data.crop_type || "wheat").toLowerCase();
  const benchmark = cropBenchmarks[cropType] || cropBenchmarks.wheat;
  let baseYield = benchmark.avg;
  const moisture = data.soil_moisture || 35;
  const ph = data.soil_ph || 6.5;
  const temp = data.temperature || 25;
  if (moisture >= 25 && moisture <= 45) baseYield *= 1.1;
  else if (moisture < 15 || moisture > 55) baseYield *= 0.8;
  if (ph >= 6.0 && ph <= 7.5) baseYield *= 1.05;
  else if (ph < 5.5 || ph > 8.0) baseYield *= 0.85;
  if (temp >= 20 && temp <= 30) baseYield *= 1.05;
  else if (temp > 38 || temp < 10) baseYield *= 0.75;
  const yieldPotential = ((baseYield - benchmark.min) / (benchmark.max - benchmark.min)) * 100;
  return {
    predicted_yield: Math.round(baseYield), confidence: 65,
    yield_potential: Math.round(Math.max(0, Math.min(100, yieldPotential))),
    unit: "kg/hectare",
    improvement_tips: [{ factor: "ML Model", current: "Fallback mode", optimal: "Full ML prediction", action: "Start Python backend for accurate predictions", potential_yield_gain: "+15%", priority: "high" }],
    model_version: "fallback_1.0",
    timestamp: new Date().toISOString(), source: "fallback",
  };
}

