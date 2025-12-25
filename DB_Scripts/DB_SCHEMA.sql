-- Smart Farming Database Schema for Supabase
-- Version 2.0 - With city, district, village support

-- ========================================
-- STEP 1: DROP EXISTING TABLES (Fresh Start)
-- ========================================
DROP TABLE IF EXISTS action_logs CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS farm_settings CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;

-- ========================================
-- STEP 2: CREATE TABLES WITH CORRECT STRUCTURE
-- ========================================

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE, -- Plain text for login (phone numbers), format: +91XXXXXXXXXX
  email VARCHAR(255), -- Optional email
  password TEXT NOT NULL, -- Hashed password for authentication
  experience VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create farms table with location details
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farm_name VARCHAR(255) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  village VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area_acres DECIMAL(10, 2),
  soil_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create farm_settings table (for crops, irrigation - to be added later)
CREATE TABLE IF NOT EXISTS farm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop VARCHAR(100),
  season VARCHAR(50),
  sowing_date DATE,
  water_source VARCHAR(100),
  irrigation_type VARCHAR(100),
  autonomous_mode BOOLEAN DEFAULT false,
  temperature_unit VARCHAR(10) DEFAULT 'celsius',
  moisture_unit VARCHAR(10) DEFAULT 'percentage',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  sensor_type VARCHAR(100),
  sensor_id VARCHAR(255) UNIQUE,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'inactive',
  mqtt_topic VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create action_logs table
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  action VARCHAR(255),
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farm_settings_farmer_id ON farm_settings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_sensors_farmer_id ON sensors(farmer_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_farmer_id ON action_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_timestamp ON action_logs(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for demo purposes)
-- In production, use proper authentication policies

CREATE POLICY "Allow anonymous insert" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON farmers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update" ON farmers FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous insert" ON farms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON farms FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update" ON farms FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous insert" ON sensors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON sensors FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update" ON sensors FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous insert" ON action_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON action_logs FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert" ON farm_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON farm_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update" ON farm_settings FOR UPDATE USING (true);
