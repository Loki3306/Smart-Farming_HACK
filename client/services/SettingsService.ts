/**
 * client/services/SettingsService.ts
 *
 * User preferences management — previously used Supabase SDK directly.
 * Now routes through backend API (/api/settings). Falls back to localStorage.
 * All public function signatures are UNCHANGED.
 */

// ── Types (unchanged) ──────────────────────────────────────────────────────

export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsAlerts: boolean;
  notificationSound: boolean;
  vibration: boolean;
  moistureAlerts: boolean;
  weatherAlerts: boolean;
  pestAlerts: boolean;
  harvestAlerts: boolean;
  language: string;
  theme: "light" | "dark" | "system";
}

export const DEFAULT_SETTINGS: UserSettings = {
  pushNotifications: true,
  emailNotifications: false,
  smsAlerts: true,
  notificationSound: true,
  vibration: true,
  moistureAlerts: true,
  weatherAlerts: true,
  pestAlerts: true,
  harvestAlerts: true,
  language: "en",
  theme: "light",
};

const STORAGE_KEY = "user_settings";

// ── DB row ↔ UserSettings converters (unchanged) ──────────────────────────

function dbRowToSettings(row: Record<string, unknown>): UserSettings {
  return {
    pushNotifications: (row.push_notifications as boolean) ?? DEFAULT_SETTINGS.pushNotifications,
    emailNotifications: (row.email_notifications as boolean) ?? DEFAULT_SETTINGS.emailNotifications,
    smsAlerts: (row.sms_alerts as boolean) ?? DEFAULT_SETTINGS.smsAlerts,
    notificationSound: (row.notification_sound as boolean) ?? DEFAULT_SETTINGS.notificationSound,
    vibration: (row.vibration as boolean) ?? DEFAULT_SETTINGS.vibration,
    moistureAlerts: (row.moisture_alerts as boolean) ?? DEFAULT_SETTINGS.moistureAlerts,
    weatherAlerts: (row.weather_alerts as boolean) ?? DEFAULT_SETTINGS.weatherAlerts,
    pestAlerts: (row.pest_alerts as boolean) ?? DEFAULT_SETTINGS.pestAlerts,
    harvestAlerts: (row.harvest_alerts as boolean) ?? DEFAULT_SETTINGS.harvestAlerts,
    language: (row.language as string) ?? DEFAULT_SETTINGS.language,
    theme: (row.theme as "light" | "dark" | "system") ?? DEFAULT_SETTINGS.theme,
  };
}

function settingsToDbRow(settings: Partial<UserSettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (settings.pushNotifications !== undefined) row.push_notifications = settings.pushNotifications;
  if (settings.emailNotifications !== undefined) row.email_notifications = settings.emailNotifications;
  if (settings.smsAlerts !== undefined) row.sms_alerts = settings.smsAlerts;
  if (settings.notificationSound !== undefined) row.notification_sound = settings.notificationSound;
  if (settings.vibration !== undefined) row.vibration = settings.vibration;
  if (settings.moistureAlerts !== undefined) row.moisture_alerts = settings.moistureAlerts;
  if (settings.weatherAlerts !== undefined) row.weather_alerts = settings.weatherAlerts;
  if (settings.pestAlerts !== undefined) row.pest_alerts = settings.pestAlerts;
  if (settings.harvestAlerts !== undefined) row.harvest_alerts = settings.harvestAlerts;
  if (settings.language !== undefined) row.language = settings.language;
  if (settings.theme !== undefined) row.theme = settings.theme;
  row.updated_at = new Date().toISOString();
  return row;
}

// ── API helpers ────────────────────────────────────────────────────────────

async function fetchSettingsFromApi(farmerId: string): Promise<UserSettings | null> {
  try {
    const res = await fetch(`/api/settings?farmer_id=${farmerId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.settings ? dbRowToSettings(data.settings) : null;
  } catch {
    return null;
  }
}

async function upsertSettingsToApi(farmerId: string, dbRow: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmer_id: farmerId, ...dbRow }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Public API (signatures unchanged) ─────────────────────────────────────

/**
 * Get user settings — localStorage first, then API.
 */
export async function getUserSettings(farmerId: string): Promise<UserSettings> {
  // 1. Quick load from localStorage
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY}_${farmerId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Background refresh from API
      fetchSettingsFromApi(farmerId).then((fresh) => {
        if (fresh) localStorage.setItem(`${STORAGE_KEY}_${farmerId}`, JSON.stringify(fresh));
      });
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn("[SettingsService] localStorage parse error:", e);
  }

  // 2. Fetch from API
  const apiSettings = await fetchSettingsFromApi(farmerId);
  if (apiSettings) {
    localStorage.setItem(`${STORAGE_KEY}_${farmerId}`, JSON.stringify(apiSettings));
    return apiSettings;
  }

  // 3. Return defaults and create them in background
  console.log("[SettingsService] No settings found, using defaults");
  upsertSettingsToApi(farmerId, settingsToDbRow(DEFAULT_SETTINGS)).catch(() => {});
  return { ...DEFAULT_SETTINGS };
}

/**
 * Update user settings — localStorage immediate, API async.
 */
export async function updateUserSettings(
  farmerId: string,
  settings: Partial<UserSettings>,
): Promise<{ success: boolean; error?: string }> {
  // Always update localStorage immediately
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY}_${farmerId}`);
    const current = cached ? JSON.parse(cached) : {};
    localStorage.setItem(`${STORAGE_KEY}_${farmerId}`, JSON.stringify({ ...current, ...settings }));
  } catch (e) {
    console.warn("[SettingsService] localStorage update error:", e);
  }

  try {
    const dbRow = settingsToDbRow(settings);
    const ok = await upsertSettingsToApi(farmerId, dbRow);
    if (!ok) return { success: false, error: "API update failed" };
    console.log("[SettingsService] Settings updated successfully");
    return { success: true };
  } catch (error) {
    console.error("[SettingsService] Update error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Clear cached settings (on logout)
 */
export function clearCachedSettings(farmerId?: string): void {
  try {
    if (farmerId) {
      localStorage.removeItem(`${STORAGE_KEY}_${farmerId}`);
    } else {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEY)) localStorage.removeItem(key);
      });
    }
  } catch (e) {
    console.warn("[SettingsService] Failed to clear cache:", e);
  }
}
