-- Add IoT device tracking columns to sensor_readings
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS battery_level DECIMAL;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS signal_strength DECIMAL;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS device_id TEXT;
