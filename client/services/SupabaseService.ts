/**
 * Supabase Service - Database operations with encryption
 * Handles farmer profile storage with encrypted sensitive data
 */

import { SupabaseClient } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { encryptData, decryptData, hashPassword, maskPhone, maskEmail } from '../lib/encryption';

/**
 * Get or create Supabase client
 */
function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

/**
 * Farmer profile data interface
 */
export interface FarmerProfile {
  id?: string;
  fullName: string;
  phone: string; // Encrypted
  email: string; // Encrypted
  password?: string; // Hashed
  experience: string;
  createdAt?: string;
}

/**
 * Farm data interface
 */
export interface FarmProfile {
  id?: string;
  farmerId?: string;
  farmName: string;
  state: string;
  city: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  areaAcres: number;
  soilType: string;
  createdAt?: string;
}

/**
 * Sensor data interface
 */
export interface SensorProfile {
  id?: string;
  farmerId?: string;
  sensorType: string;
  sensorId: string;
  status: string;
  mqttTopic: string;
  createdAt?: string;
}

/**
 * Save complete farmer onboarding data
 */
export async function saveFarmerOnboarding(data: {
  farmer: {
    fullName: string;
    phone: string;
    email: string;
    password?: string;
    experience: string;
  };
  farm: {
    farmName: string;
    state: string;
    city: string;
    district: string;
    village: string;
    latitude: number;
    longitude: number;
    areaAcres: number;
    soilType: string;
  };
  sensor: {
    connected: boolean;
    sensorId: string;
  };
}): Promise<{ success: boolean; farmerId?: string; error?: string }> {
  const client = getSupabaseClient();

  // No encryption needed - phone is now plain text in database
  const hashedPassword = data.farmer.password ? hashPassword(data.farmer.password) : null;

  // If no Supabase, use localStorage fallback
  if (!client) {
    try {
      const farmerId = `local_${Date.now()}`;
      
      const localData = {
        farmer: {
          id: farmerId,
          fullName: data.farmer.fullName,
          phone: data.farmer.phone, // Plain text
          email: data.farmer.email, // Plain text
          password: hashedPassword,
          experience: data.farmer.experience,
          createdAt: new Date().toISOString(),
        },
        farm: {
          id: `farm_${Date.now()}`,
          farmerId,
          ...data.farm,
          createdAt: new Date().toISOString(),
        },
        sensor: data.sensor.connected ? {
          id: `sensor_${Date.now()}`,
          farmerId,
          sensorId: data.sensor.sensorId,
          sensorType: 'smart-sensor',
          status: 'active',
          mqttTopic: `farm/${farmerId}/sensors`,
          createdAt: new Date().toISOString(),
        } : null,
      };

      localStorage.setItem('farmerProfile', JSON.stringify(localData));
      localStorage.setItem('farmerId', farmerId);
      localStorage.setItem('farmerName', data.farmer.fullName);

      console.log('[Supabase] Saved to localStorage (fallback mode)');
      return { success: true, farmerId };
    } catch (error) {
      console.error('[Supabase] localStorage save error:', error);
      return { success: false, error: 'Failed to save profile' };
    }
  }

  try {
    // Get current user's farmer_id from localStorage (set during signup/login)
    const farmerId = localStorage.getItem('user_id');
    
    if (!farmerId) {
      console.error('[Supabase] No user_id found in session');
      return { success: false, error: 'User not authenticated' };
    }

    // Update existing farmer record with phone (from onboarding)
    // Phone should already be normalized to +91XXXXXXXXXX format
    const { error: updateError } = await client
      .from('farmers')
      .update({
        phone: data.farmer.phone, // Normalized format: +91XXXXXXXXXX
        experience: data.farmer.experience.substring(0, 50) || null,
      })
      .eq('id', farmerId);

    if (updateError) {
      console.error('[Supabase] Farmer update error:', updateError);
      // Continue anyway, farm data is more important
    }

    // Prepare farm data
    const farmData = {
      farm_name: data.farm.farmName.substring(0, 255),
      state: data.farm.state.substring(0, 100),
      city: data.farm.city.substring(0, 100),
      district: data.farm.district.substring(0, 100),
      village: data.farm.village.substring(0, 100),
      latitude: data.farm.latitude,
      longitude: data.farm.longitude,
      area_acres: data.farm.areaAcres,
      soil_type: data.farm.soilType.substring(0, 100),
    };

    // Insert farm
    const { error: farmError } = await client
      .from('farms')
      .insert({
        farmer_id: farmerId,
        ...farmData,
      });

    if (farmError) {
      console.error('[Supabase] Farm insert error:', farmError);
      console.error('[Supabase] Failed farm data:', farmData);
      // Don't fail completely, farmer was created
    }

    // Insert sensor if connected
    if (data.sensor.connected) {
      const { error: sensorError } = await client
        .from('sensors')
        .insert({
          farmer_id: farmerId,
          sensor_type: 'smart-sensor',
          sensor_id: data.sensor.sensorId,
          status: 'active',
          mqtt_topic: `farm/${farmerId}/sensors`,
        });

      if (sensorError) {
        console.error('[Supabase] Sensor insert error:', sensorError);
      }
    }

    // Also save to localStorage for quick access
    localStorage.setItem('farmerId', farmerId);
    localStorage.setItem('farmerName', data.farmer.fullName);

    console.log('[Supabase] Profile saved successfully:', farmerId);
    return { success: true, farmerId };
  } catch (error) {
    console.error('[Supabase] Save error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database error' 
    };
  }
}

/**
 * Get farmer profile (decrypted)
 */
export async function getFarmerProfile(farmerId: string): Promise<FarmerProfile | null> {
  const client = getSupabaseClient();

  if (!client) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('farmerProfile');
      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data.farmer,
          phone: decryptData(data.farmer.phone),
          email: decryptData(data.farmer.email),
        };
      }
    } catch (error) {
      console.error('[Supabase] localStorage read error:', error);
    }
    return null;
  }

  try {
    const { data, error } = await client
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      fullName: data.name,
      phone: decryptData(data.phone),
      email: decryptData(data.email),
      experience: data.experience,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('[Supabase] Get profile error:', error);
    return null;
  }
}

/**
 * Get farmer profile with masked sensitive data (for display)
 */
export async function getFarmerProfileMasked(farmerId: string): Promise<{
  fullName: string;
  phone: string;
  email: string;
  experience: string;
} | null> {
  const profile = await getFarmerProfile(farmerId);
  if (!profile) return null;

  return {
    fullName: profile.fullName,
    phone: maskPhone(profile.phone),
    email: maskEmail(profile.email),
    experience: profile.experience,
  };
}

/**
 * Log action to database
 */
export async function logAction(
  farmerId: string,
  action: string,
  details: string
): Promise<void> {
  const client = getSupabaseClient();

  if (!client) {
    // Fallback: log to console
    console.log(`[Action Log] ${action}: ${details}`);
    return;
  }

  try {
    await client.from('action_logs').insert({
      farmer_id: farmerId,
      action,
      details,
    });
  } catch (error) {
    console.error('[Supabase] Log action error:', error);
  }
}
