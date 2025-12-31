import { createClient } from '@supabase/supabase-js';

// Supabase Configuration from environment variables (Node.js backend)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file'
  );
}

// Create and export Supabase client with service role (bypasses RLS for backend operations)
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database helper functions
export const db = {
  // Farms
  async getFarms(farmerId: string) {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getFarmById(farmId: string) {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createFarm(farm: any) {
    const { data, error } = await supabase
      .from('farms')
      .insert([farm])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateFarm(farmId: string, updates: any) {
    const { data, error } = await supabase
      .from('farms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', farmId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Sensors
  async getLatestSensorData(farmId: string) {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('farm_id', farmId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no data exists, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async saveSensorData(sensorData: any) {
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert([sensorData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSensorHistory(farmId: string, limit = 100) {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('farm_id', farmId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Action Logs
  async getActionLogs(farmerId: string, limit = 50) {
    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getActionLogsSince(farmerId: string, sinceIso: string) {
    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('farmer_id', farmerId)
      .gt('timestamp', sinceIso)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createActionLog(log: any) {
    // DB schema (DB_Scripts/DB_SCHEMA.sql): farmer_id, action, details, timestamp
    // Keep backward compatibility with older call sites that used action_type/description.
    const normalized = {
      farmer_id: log?.farmer_id,
      action: log?.action ?? log?.action_type,
      details: log?.details ?? log?.description,
      timestamp: log?.timestamp,
    };

    const { data, error } = await supabase
      .from('action_logs')
      .insert([normalized])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Farm Settings
  async getFarmSettings(farmerId: string) {
    const { data, error } = await supabase
      .from('farm_settings')
      .select('*')
      .eq('farmer_id', farmerId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async saveFarmSettings(settings: any) {
    const { data, error } = await supabase
      .from('farm_settings')
      .upsert([settings])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};
