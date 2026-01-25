/**
 * Settings Service - User preferences management
 * Handles CRUD operations for user settings in Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

function getSupabaseClient(): SupabaseClient | null {
    return supabase;
}

/**
 * User settings interface matching the database schema
 */
export interface UserSettings {
    // Notification preferences
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsAlerts: boolean;
    notificationSound: boolean;
    vibration: boolean;

    // Alert preferences
    moistureAlerts: boolean;
    weatherAlerts: boolean;
    pestAlerts: boolean;
    harvestAlerts: boolean;

    // App preferences
    language: string;
    theme: 'light' | 'dark' | 'system';
}

/**
 * Default settings for new users
 */
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
    language: 'en',
    theme: 'light',
};

const STORAGE_KEY = 'user_settings';

/**
 * Convert database row to UserSettings object
 */
function dbRowToSettings(row: Record<string, unknown>): UserSettings {
    return {
        pushNotifications: row.push_notifications as boolean ?? DEFAULT_SETTINGS.pushNotifications,
        emailNotifications: row.email_notifications as boolean ?? DEFAULT_SETTINGS.emailNotifications,
        smsAlerts: row.sms_alerts as boolean ?? DEFAULT_SETTINGS.smsAlerts,
        notificationSound: row.notification_sound as boolean ?? DEFAULT_SETTINGS.notificationSound,
        vibration: row.vibration as boolean ?? DEFAULT_SETTINGS.vibration,
        moistureAlerts: row.moisture_alerts as boolean ?? DEFAULT_SETTINGS.moistureAlerts,
        weatherAlerts: row.weather_alerts as boolean ?? DEFAULT_SETTINGS.weatherAlerts,
        pestAlerts: row.pest_alerts as boolean ?? DEFAULT_SETTINGS.pestAlerts,
        harvestAlerts: row.harvest_alerts as boolean ?? DEFAULT_SETTINGS.harvestAlerts,
        language: row.language as string ?? DEFAULT_SETTINGS.language,
        theme: (row.theme as 'light' | 'dark' | 'system') ?? DEFAULT_SETTINGS.theme,
    };
}

/**
 * Convert UserSettings object to database row format
 */
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

/**
 * Get user settings from database or localStorage fallback
 */
export async function getUserSettings(farmerId: string): Promise<UserSettings> {
    const client = getSupabaseClient();

    // Try localStorage first for quick load
    try {
        const cached = localStorage.getItem(`${STORAGE_KEY}_${farmerId}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Return cached but also refresh from DB in background
            if (client) {
                refreshSettingsFromDb(farmerId, client);
            }
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.warn('[SettingsService] localStorage parse error:', e);
    }

    // If no Supabase, return defaults
    if (!client) {
        console.log('[SettingsService] No Supabase client, using defaults');
        return { ...DEFAULT_SETTINGS };
    }

    try {
        const { data, error } = await client
            .from('farm_settings')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No row found - create default settings
                console.log('[SettingsService] No settings found, creating defaults');
                await createDefaultSettings(farmerId, client);
                return { ...DEFAULT_SETTINGS };
            }
            throw error;
        }

        const settings = dbRowToSettings(data);

        // Cache in localStorage
        localStorage.setItem(`${STORAGE_KEY}_${farmerId}`, JSON.stringify(settings));

        return settings;
    } catch (error) {
        console.error('[SettingsService] Failed to fetch settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * Background refresh settings from database
 */
async function refreshSettingsFromDb(farmerId: string, client: SupabaseClient): Promise<void> {
    try {
        const { data, error } = await client
            .from('farm_settings')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();

        if (!error && data) {
            const settings = dbRowToSettings(data);
            localStorage.setItem(`${STORAGE_KEY}_${farmerId}`, JSON.stringify(settings));
        }
    } catch (e) {
        // Silent fail for background refresh
    }
}

/**
 * Create default settings for a new user
 */
async function createDefaultSettings(farmerId: string, client: SupabaseClient): Promise<void> {
    try {
        const { error } = await client
            .from('farm_settings')
            .insert({
                farmer_id: farmerId,
                ...settingsToDbRow(DEFAULT_SETTINGS),
            });

        if (error) {
            console.error('[SettingsService] Failed to create default settings:', error);
        }
    } catch (e) {
        console.error('[SettingsService] Error creating defaults:', e);
    }
}

/**
 * Update user settings in database
 */
export async function updateUserSettings(
    farmerId: string,
    settings: Partial<UserSettings>
): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();

    // Always update localStorage for immediate effect
    try {
        const cached = localStorage.getItem(`${STORAGE_KEY}_${farmerId}`);
        const current = cached ? JSON.parse(cached) : {};
        const updated = { ...current, ...settings };
        localStorage.setItem(`${STORAGE_KEY}_${farmerId}`, JSON.stringify(updated));
    } catch (e) {
        console.warn('[SettingsService] localStorage update error:', e);
    }

    // If no Supabase, we're done
    if (!client) {
        return { success: true };
    }

    try {
        const dbRow = settingsToDbRow(settings);

        // Upsert: update if exists, insert if not
        const { error } = await client
            .from('farm_settings')
            .upsert(
                {
                    farmer_id: farmerId,
                    ...dbRow,
                },
                {
                    onConflict: 'farmer_id',
                }
            );

        if (error) {
            console.error('[SettingsService] Failed to update settings:', error);
            return { success: false, error: error.message };
        }

        console.log('[SettingsService] Settings updated successfully');
        return { success: true };
    } catch (error) {
        console.error('[SettingsService] Update error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
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
            // Clear all cached settings
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(STORAGE_KEY)) {
                    localStorage.removeItem(key);
                }
            });
        }
    } catch (e) {
        console.warn('[SettingsService] Failed to clear cache:', e);
    }
}
