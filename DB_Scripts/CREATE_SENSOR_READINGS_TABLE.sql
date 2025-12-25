-- Create sensor_readings table for actual sensor data
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES farms(id) ON DELETE CASCADE,
  
  -- Soil metrics
  soil_moisture DECIMAL(5,2),  -- Percentage (0-100)
  temperature DECIMAL(5,2),    -- Celsius
  ph DECIMAL(4,2),            -- pH value (0-14)
  
  -- NPK values (mg/kg or ppm)
  nitrogen INTEGER,
  phosphorus INTEGER,
  potassium INTEGER,
  
  -- Metadata
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE pg_default;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_farmer_id 
  ON public.sensor_readings USING btree (farmer_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_sensor_readings_farm_id 
  ON public.sensor_readings USING btree (farm_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
  ON public.sensor_readings USING btree (timestamp DESC) TABLESPACE pg_default;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Sample RLS policy (adjust based on your auth setup)
CREATE POLICY "Farmers can view their own sensor readings"
  ON public.sensor_readings
  FOR SELECT
  USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can insert their own sensor readings"
  ON public.sensor_readings
  FOR INSERT
  WITH CHECK (farmer_id = auth.uid());
