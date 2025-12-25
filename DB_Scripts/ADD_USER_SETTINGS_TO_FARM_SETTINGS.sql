-- Add user preference columns to farm_settings table
-- This allows storing notification and app preferences alongside farm data

-- Add notification preferences
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT true;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS vibration BOOLEAN DEFAULT true;

-- Add alert preferences
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS moisture_alerts BOOLEAN DEFAULT true;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS weather_alerts BOOLEAN DEFAULT true;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS pest_alerts BOOLEAN DEFAULT true;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS harvest_alerts BOOLEAN DEFAULT true;

-- Add app preferences
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- Create index for farmer_id if not exists (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_farm_settings_farmer_unique ON farm_settings(farmer_id);

-- Add RLS policies if not exist
CREATE POLICY IF NOT EXISTS "Allow anonymous update settings" ON farm_settings FOR UPDATE USING (true);
