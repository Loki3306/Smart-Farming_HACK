/**
 * server/db/supabase.ts
 *
 * DB helper layer — previously Supabase, now backed by Neon PostgreSQL via pg.
 * The exported `db` object interface is UNCHANGED so no routes need modification.
 */

import { query } from "./neon.js";

const FARM_COLUMNS = [
  "f.id",
  "f.farmer_id",
  "f.farm_name",
  "f.soil_type",
  "f.latitude",
  "f.longitude",
  "f.created_at",
  "f.state",
  "f.city",
  "f.district",
  "f.village",
  "f.area_acres",
  "f.crop_type",
  "f.season",
  "f.water_source",
  "f.irrigation_type",
  "f.updated_at",
  "NULL::text AS location",
  "f.crop_type AS crop",
  "f.area_acres AS total_area_acres",
  "TRUE AS is_active",
].join(", ");

const SENSOR_READING_COLUMNS = [
  "sr.id",
  "sr.farm_id",
  "sr.soil_moisture",
  "sr.temperature",
  "sr.humidity",
  "sr.created_at",
  "sr.created_at AS timestamp",
  "f.farmer_id",
  "NULL::numeric AS nitrogen",
  "NULL::numeric AS phosphorus",
  "NULL::numeric AS potassium",
  "NULL::numeric AS ph",
  "NULL::numeric AS ec",
].join(", ");

const ACTION_LOG_COLUMNS = [
  "id",
  "farmer_id",
  "action",
  "action AS details",
  "created_at",
  "created_at AS timestamp",
].join(", ");

const FARM_SETTINGS_COLUMNS = ["farmer_id", "crop"].join(", ");

// ============================================================================
// Database helper functions
// ============================================================================
export const db = {
  // --------------------------------------------------------------------------
  // FARMS
  // --------------------------------------------------------------------------

  async getFarms(farmerId: string) {
    const result = await query(
      `SELECT ${FARM_COLUMNS} FROM farms f
       WHERE f.farmer_id = $1
       ORDER BY f.created_at DESC`,
      [farmerId],
    );
    return result.rows;
  },

  async getFarmById(farmId: string) {
    const result = await query(
      `SELECT ${FARM_COLUMNS} FROM farms f WHERE f.id = $1 LIMIT 1`,
      [farmId],
    );
    if (result.rows.length === 0) throw { code: "PGRST116", message: "Not found" };
    return result.rows[0];
  },

  async createFarm(farm: any) {
    const normalized = {
      farmer_id: farm?.farmer_id,
      farm_name: farm?.farm_name,
      latitude: farm?.latitude,
      longitude: farm?.longitude,
      soil_type: farm?.soil_type,
      state: farm?.state,
      city: farm?.city,
      district: farm?.district,
      village: farm?.village,
      area_acres: farm?.area_acres,
      crop_type: farm?.crop_type,
      season: farm?.season,
      water_source: farm?.water_source,
      irrigation_type: farm?.irrigation_type,
      created_at: farm?.created_at,
      updated_at: farm?.updated_at,
    };

    const keys = Object.keys(normalized).filter(
      (k) => normalized[k as keyof typeof normalized] !== undefined,
    );
    const values = keys.map((k) => normalized[k as keyof typeof normalized]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const cols = keys.join(", ");

    const result = await query(
      `INSERT INTO farms (${cols}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  },

  async updateFarm(farmId: string, updates: any) {
    const allowedUpdates = {
      farm_name: updates?.farm_name,
      latitude: updates?.latitude,
      longitude: updates?.longitude,
      soil_type: updates?.soil_type,
      state: updates?.state,
      city: updates?.city,
      district: updates?.district,
      village: updates?.village,
      area_acres: updates?.area_acres,
      crop_type: updates?.crop_type,
      season: updates?.season,
      water_source: updates?.water_source,
      irrigation_type: updates?.irrigation_type,
      updated_at: new Date().toISOString(),
    };

    const keys = Object.keys(allowedUpdates).filter(
      (k) => allowedUpdates[k as keyof typeof allowedUpdates] !== undefined,
    );
    const values = keys.map((k) =>
      allowedUpdates[k as keyof typeof allowedUpdates],
    );

    if (keys.length === 0) {
      const existing = await query(
        `SELECT ${FARM_COLUMNS} FROM farms f WHERE f.id = $1 LIMIT 1`,
        [farmId],
      );
      if (existing.rows.length === 0) throw new Error("Farm not found");
      return existing.rows[0];
    }

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
      `SELECT ${SENSOR_READING_COLUMNS} FROM sensor_readings sr
       LEFT JOIN farms f ON f.id = sr.farm_id
       WHERE sr.farm_id = $1
       ORDER BY sr.created_at DESC
       LIMIT 1`,
      [farmId],
    );
    if (result.rows.length === 0) return null; // matches old PGRST116 behaviour
    return result.rows[0];
  },

  async saveSensorData(sensorData: any) {
    const normalized = {
      farm_id: sensorData?.farm_id,
      soil_moisture: sensorData?.soil_moisture,
      temperature: sensorData?.temperature,
      humidity: sensorData?.humidity,
      created_at: sensorData?.timestamp ?? sensorData?.created_at,
    };

    const keys = Object.keys(normalized).filter(
      (k) => normalized[k as keyof typeof normalized] !== undefined,
    );
    const values = keys.map((k) => normalized[k as keyof typeof normalized]);
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
      `SELECT ${SENSOR_READING_COLUMNS} FROM sensor_readings sr
       LEFT JOIN farms f ON f.id = sr.farm_id
       WHERE sr.farm_id = $1
       ORDER BY sr.created_at DESC
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
      `SELECT ${ACTION_LOG_COLUMNS} FROM action_logs
       WHERE farmer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [farmerId, limit],
    );
    return result.rows;
  },

  async getActionLogsSince(farmerId: string, sinceIso: string) {
    const result = await query(
      `SELECT ${ACTION_LOG_COLUMNS} FROM action_logs
       WHERE farmer_id = $1
         AND created_at > $2
       ORDER BY created_at ASC`,
      [farmerId, sinceIso],
    );
    return result.rows;
  },

  async createActionLog(log: any) {
    // Normalise field names — keep backward compat with old call sites
    const normalized = {
      farmer_id: log?.farmer_id,
      action:
        log?.action ??
        log?.action_type ??
        log?.details ??
        log?.description,
      created_at: log?.timestamp,
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
      `SELECT ${FARM_SETTINGS_COLUMNS} FROM farm_settings WHERE farmer_id = $1 LIMIT 1`,
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

