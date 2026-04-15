-- Create sensor_logs table for storing MQTT sensor telemetry
CREATE TABLE IF NOT EXISTS public.sensor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id VARCHAR(100) NOT NULL,
    moisture NUMERIC(5, 2) NOT NULL,
    temp NUMERIC(5, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL,
    npk INTEGER,
    ec_salinity NUMERIC(4, 2),
    wind_speed NUMERIC(5, 2),
    soil_ph NUMERIC(4, 2),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX idx_sensor_logs_farm_id ON public.sensor_logs (farm_id);
CREATE INDEX idx_sensor_logs_timestamp ON public.sensor_logs (timestamp DESC);
CREATE INDEX idx_sensor_logs_farm_timestamp ON public.sensor_logs (farm_id, timestamp DESC);
