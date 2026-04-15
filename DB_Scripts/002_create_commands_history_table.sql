-- Create commands_history table for logging farm control commands
CREATE TABLE IF NOT EXISTS public.commands_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    value BOOLEAN NOT NULL,
    mode VARCHAR(20) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT commands_history_action_check 
        CHECK (action IN ('irrigation', 'fertilization'))
);

-- Create indexes for query performance
CREATE INDEX idx_commands_history_farm_id ON public.commands_history (farm_id);
CREATE INDEX idx_commands_history_timestamp ON public.commands_history (timestamp DESC);
