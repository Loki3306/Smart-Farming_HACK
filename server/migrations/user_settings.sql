-- User Settings Table for Smart Farming App
-- Stores per-farmer preferences for notifications, alerts, language, and theme

-- ========================================
-- CREATE USER_SETTINGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Notification Preferences
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  sms_alerts BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  vibration BOOLEAN DEFAULT true,
  
  -- Alert Preferences
  moisture_alerts BOOLEAN DEFAULT true,
  weather_alerts BOOLEAN DEFAULT true,
  pest_alerts BOOLEAN DEFAULT true,
  harvest_alerts BOOLEAN DEFAULT true,
  
  -- App Preferences
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_farmer_id ON user_settings(farmer_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for access
CREATE POLICY "Allow anonymous insert" ON user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON user_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update" ON user_settings FOR UPDATE USING (true);
