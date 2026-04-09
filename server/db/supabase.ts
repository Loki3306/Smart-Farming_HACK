/**
 * server/db/supabase.ts
 *
 * DB helper layer — previously Supabase, now backed by Neon PostgreSQL via pg.
 * The exported `db` object interface is UNCHANGED so no routes need modification.
 */

import { query } from "./neon";

// ============================================================================
// Database helper functions
// ============================================================================
export const db = {
  // --------------------------------------------------------------------------
  // FARMS
  // --------------------------------------------------------------------------

  async getFarms(farmerId: string) {
    const result = await query(
      `SELECT * FROM farms
       WHERE farmer_id = $1
       ORDER BY created_at DESC`,
      [farmerId],
    );
    return result.rows;
  },

  async getFarmById(farmId: string) {
    const result = await query(
      `SELECT * FROM farms WHERE id = $1 LIMIT 1`,
      [farmId],
    );
    if (result.rows.length === 0) throw { code: "PGRST116", message: "Not found" };
    return result.rows[0];
  },

  async createFarm(farm: any) {
    const keys = Object.keys(farm);
    const values = Object.values(farm);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const cols = keys.join(", ");

    const result = await query(
      `INSERT INTO farms (${cols}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  },

  async updateFarm(farmId: string, updates: any) {
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const keys = Object.keys(updatesWithTimestamp);
    const values = Object.values(updatesWithTimestamp);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    const result = await query(
      `UPDATE farms SET ${setClauses}
       WHERE id = $${keys.length + 1}
       RETURNING *`,
      [...values, farmId],
    );
    if (result.rows.length === 0) throw new Error("Farm not found");
    return result.rows[0];
  },

  // --------------------------------------------------------------------------
  // SENSORS
  // --------------------------------------------------------------------------

  async getLatestSensorData(farmId: string) {
    const result = await query(
      `SELECT * FROM sensor_readings
       WHERE farm_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [farmId],
    );
    if (result.rows.length === 0) return null; // matches old PGRST116 behaviour
    return result.rows[0];
  },

  async saveSensorData(sensorData: any) {
    const keys = Object.keys(sensorData);
    const values = Object.values(sensorData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const cols = keys.join(", ");

    const result = await query(
      `INSERT INTO sensor_readings (${cols}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  },

  async getSensorHistory(farmId: string, limit = 100) {
    const result = await query(
      `SELECT * FROM sensor_readings
       WHERE farm_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [farmId, limit],
    );
    return result.rows;
  },

  // --------------------------------------------------------------------------
  // ACTION LOGS
  // --------------------------------------------------------------------------

  async getActionLogs(farmerId: string, limit = 50) {
    const result = await query(
      `SELECT * FROM action_logs
       WHERE farmer_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [farmerId, limit],
    );
    return result.rows;
  },

  async getActionLogsSince(farmerId: string, sinceIso: string) {
    const result = await query(
      `SELECT * FROM action_logs
       WHERE farmer_id = $1
         AND timestamp > $2
       ORDER BY timestamp ASC`,
      [farmerId, sinceIso],
    );
    return result.rows;
  },

  async createActionLog(log: any) {
    // Normalise field names — keep backward compat with old call sites
    const normalized = {
      farmer_id: log?.farmer_id,
      action: log?.action ?? log?.action_type,
      details: log?.details ?? log?.description,
      timestamp: log?.timestamp,
    };

    const keys = Object.keys(normalized).filter(
      (k) => normalized[k as keyof typeof normalized] !== undefined,
    );
    const values = keys.map((k) => normalized[k as keyof typeof normalized]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const cols = keys.join(", ");

    const result = await query(
      `INSERT INTO action_logs (${cols}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  },

  // --------------------------------------------------------------------------
  // FARM SETTINGS
  // --------------------------------------------------------------------------

  async getFarmSettings(farmerId: string) {
    const result = await query(
      `SELECT * FROM farm_settings WHERE farmer_id = $1 LIMIT 1`,
      [farmerId],
    );
    if (result.rows.length === 0) return null; // matches old PGRST116 behaviour
    return result.rows[0];
  },

  async saveFarmSettings(settings: any) {
    const keys = Object.keys(settings);
    const values = Object.values(settings);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const cols = keys.join(", ");

    // Upsert on farmer_id
    const updateClauses = keys
      .filter((k) => k !== "farmer_id")
      .map((k, i) => `${k} = EXCLUDED.${k}`)
      .join(", ");

    const result = await query(
      `INSERT INTO farm_settings (${cols}) VALUES (${placeholders})
       ON CONFLICT (farmer_id) DO UPDATE SET ${updateClauses}
       RETURNING *`,
      values,
    );
    return result.rows[0];
  },
};
