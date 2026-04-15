/**
 * client/services/SupabaseService.ts
 *
 * Farmer profile service — previously used Supabase SDK directly.
 * Now routes all DB writes through the backend API (/api/farms, /api/sensors, etc.)
 * Falls back to localStorage when offline / unauthenticated.
 */

import {
  encryptData,
  decryptData,
  hashPassword,
  maskPhone,
  maskEmail,
} from "../lib/encryption";

// ── Types (unchanged) ──────────────────────────────────────────────────────

export interface FarmerProfile {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  experience: string;
  createdAt?: string;
}

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

export interface SensorProfile {
  id?: string;
  farmerId?: string;
  sensorType: string;
  sensorId: string;
  status: string;
  mqttTopic: string;
  createdAt?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiPost(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function apiPut(path: string, body: object) {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${path} failed: ${res.status}`);
  }
  return res.json();
}

// ── Implementation ─────────────────────────────────────────────────────────

/**
 * Save complete farmer onboarding data
 */
export async function saveFarmerOnboarding(data: {
  farmer: { fullName: string; phone: string; email: string; password?: string; experience: string };
  farm: { farmName: string; state: string; city: string; district: string; village: string; latitude: number; longitude: number; areaAcres: number; soilType: string };
  sensor: { connected: boolean; sensorId: string };
}): Promise<{ success: boolean; farmerId?: string; error?: string }> {
  const hashedPassword = data.farmer.password ? hashPassword(data.farmer.password) : null;

  const farmerId = localStorage.getItem("user_id");

  // Offline / pre-auth fallback
  if (!farmerId) {
    try {
      const localId = `local_${Date.now()}`;
      const localData = {
        farmer: { id: localId, fullName: data.farmer.fullName, phone: data.farmer.phone, email: data.farmer.email, password: hashedPassword, experience: data.farmer.experience, createdAt: new Date().toISOString() },
        farm: { id: `farm_${Date.now()}`, farmerId: localId, ...data.farm, createdAt: new Date().toISOString() },
        sensor: data.sensor.connected ? { id: `sensor_${Date.now()}`, farmerId: localId, sensorId: data.sensor.sensorId, sensorType: "smart-sensor", status: "active", mqttTopic: `farm/${localId}/sensors`, createdAt: new Date().toISOString() } : null,
      };
      localStorage.setItem("farmerProfile", JSON.stringify(localData));
      localStorage.setItem("farmerId", localId);
      localStorage.setItem("farmerName", data.farmer.fullName);
      console.log("[Service] Saved to localStorage (offline mode)");
      return { success: true, farmerId: localId };
    } catch (error) {
      return { success: false, error: "Failed to save profile" };
    }
  }

  try {
    // 1. Update farmer profile (auth table) with validated ID
    await apiPut("/api/auth/update", {
      id: farmerId,
      phone: data.farmer.phone,
      email: data.farmer.email || null,
      fullName: data.farmer.fullName,
    }).catch((e) => console.warn("[Service] Farmer update:", e.message));

    // 2. Create farm
    const farmResponse = await apiPost("/api/farms", {
      farmer_id: farmerId,
      farm_name: data.farm.farmName.substring(0, 255),
      state: data.farm.state.substring(0, 100),
      city: data.farm.city.substring(0, 100),
      district: data.farm.district.substring(0, 100),
      village: data.farm.village.substring(0, 100),
      latitude: data.farm.latitude,
      longitude: data.farm.longitude,
      area_acres: data.farm.areaAcres,
      soil_type: data.farm.soilType.substring(0, 100),
      crop_type: "wheat",
    });
    const createdFarmId = farmResponse?.farm?.id;
    if (typeof createdFarmId === "string" && createdFarmId.trim()) {
      localStorage.setItem("current_farm_id", createdFarmId);
    }

    // 2.1 Save farm settings crop used by dashboard cards
    await apiPost("/api/settings", {
      farmer_id: farmerId,
      crop: "wheat",
    }).catch((e) => console.warn("[Service] Settings save:", e.message));

    // 3. Register sensor if connected
    if (data.sensor.connected && createdFarmId) {
      await apiPost("/api/sensors", {
        farm_id: createdFarmId,
        soil_moisture: 62,
        temperature: 24.5,
        humidity: 68,
        timestamp: new Date().toISOString(),
      }).catch((e) => console.warn("[Service] Sensor insert:", e.message));
    }

    localStorage.setItem("farmerId", farmerId);
    localStorage.setItem("user_id", farmerId);
    localStorage.setItem("farmerName", data.farmer.fullName);

    console.log("[Service] Profile saved successfully:", farmerId);
    return { success: true, farmerId };
  } catch (error) {
    console.error("[Service] Save error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Database error" };
  }
}

/**
 * Get farmer profile (decrypted)
 */
export async function getFarmerProfile(farmerId: string): Promise<FarmerProfile | null> {
  // Offline fallback
  const stored = localStorage.getItem("farmerProfile");
  if (stored) {
    try {
      const local = JSON.parse(stored);
      if (local.farmer) {
        return { ...local.farmer, phone: decryptData(local.farmer.phone), email: decryptData(local.farmer.email) };
      }
    } catch { /* ignore */ }
  }

  try {
    const res = await fetch(`/api/farms?farmerId=${farmerId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const farmer = data.farmer || data;
    if (!farmer) return null;
    return {
      id: farmer.id,
      fullName: farmer.name,
      phone: decryptData(farmer.phone),
      email: decryptData(farmer.email),
      experience: farmer.experience,
      createdAt: farmer.created_at,
    };
  } catch (error) {
    console.error("[Service] Get profile error:", error);
    return null;
  }
}

/**
 * Get farmer profile with masked sensitive data (for display)
 */
export async function getFarmerProfileMasked(farmerId: string) {
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
 * Log action to backend
 */
export async function logAction(farmerId: string, action: string, details: string): Promise<void> {
  try {
    await apiPost("/api/sensors/action-logs", { farmer_id: farmerId, action, details });
  } catch (error) {
    console.log(`[Action Log] ${action}: ${details}`);
  }
}
