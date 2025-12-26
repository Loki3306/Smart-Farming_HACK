-- =====================================================
-- VOICE & VIDEO CALL SYSTEM
-- WebRTC-based calling for chat platform
-- Created: December 26, 2025
-- =====================================================

-- =====================================================
-- 1. CALLS TABLE
-- Tracks call history and status
-- =====================================================

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('voice', 'video')),
  status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_calls_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_calls_caller FOREIGN KEY (caller_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_calls_receiver FOREIGN KEY (receiver_id) REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Validation
  CONSTRAINT check_different_caller_receiver CHECK (caller_id != receiver_id)
);

-- =====================================================
-- 2. CALL SIGNALING TABLE
-- Ephemeral table for WebRTC signaling
-- =====================================================

CREATE TABLE IF NOT EXISTS call_signaling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice_candidate', 'end')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_signaling_call FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  CONSTRAINT fk_signaling_sender FOREIGN KEY (sender_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_signaling_receiver FOREIGN KEY (receiver_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_calls_conversation_id ON calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signaling_call_id ON call_signaling(call_id);
CREATE INDEX IF NOT EXISTS idx_signaling_receiver_id ON call_signaling(receiver_id);
CREATE INDEX IF NOT EXISTS idx_signaling_created_at ON call_signaling(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signaling ENABLE ROW LEVEL SECURITY;

-- Calls: Permissive policies for custom auth (not using Supabase Auth)
CREATE POLICY "Anyone can view calls" 
ON calls 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create calls" 
ON calls 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update calls" 
ON calls 
FOR UPDATE 
USING (true);

-- Call signaling: Permissive policies for custom auth
CREATE POLICY "Anyone can view signaling" 
ON call_signaling 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create signaling messages" 
ON call_signaling 
FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Create a new call
CREATE OR REPLACE FUNCTION create_call(
  p_conversation_id UUID,
  p_caller_id UUID,
  p_receiver_id UUID,
  p_call_type VARCHAR(10)
)
RETURNS UUID AS $$
DECLARE
  new_call_id UUID;
BEGIN
  INSERT INTO calls (conversation_id, caller_id, receiver_id, call_type, status)
  VALUES (p_conversation_id, p_caller_id, p_receiver_id, p_call_type, 'ringing')
  RETURNING id INTO new_call_id;
  
  RETURN new_call_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update call status
CREATE OR REPLACE FUNCTION update_call_status(
  p_call_id UUID,
  p_status VARCHAR(20)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE calls
  SET 
    status = p_status,
    started_at = CASE WHEN p_status = 'accepted' THEN CURRENT_TIMESTAMP ELSE started_at END,
    ended_at = CASE WHEN p_status IN ('ended', 'rejected', 'missed', 'failed') THEN CURRENT_TIMESTAMP ELSE ended_at END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_call_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate call duration when ended
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('ended') AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate duration on call end
DROP TRIGGER IF EXISTS trigger_calculate_call_duration ON calls;
CREATE TRIGGER trigger_calculate_call_duration
BEFORE UPDATE ON calls
FOR EACH ROW
WHEN (NEW.status IN ('ended', 'failed') AND OLD.status != NEW.status)
EXECUTE FUNCTION calculate_call_duration();

-- Function: Clean old signaling data (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_signaling()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM call_signaling
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's call history
CREATE OR REPLACE FUNCTION get_user_call_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  call_id UUID,
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  call_type VARCHAR(10),
  status VARCHAR(20),
  was_caller BOOLEAN,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS call_id,
    c.conversation_id,
    CASE 
      WHEN c.caller_id = p_user_id THEN c.receiver_id 
      ELSE c.caller_id 
    END AS other_user_id,
    CASE 
      WHEN c.caller_id = p_user_id THEN rf.name 
      ELSE cf.name 
    END AS other_user_name,
    c.call_type,
    c.status,
    (c.caller_id = p_user_id) AS was_caller,
    c.duration_seconds,
    c.created_at
  FROM calls c
  LEFT JOIN farmers cf ON c.caller_id = cf.id
  LEFT JOIN farmers rf ON c.receiver_id = rf.id
  WHERE c.caller_id = p_user_id OR c.receiver_id = p_user_id
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- ENABLE REALTIME REPLICATION
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signaling;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- 1. Initiate a call
SELECT create_call(
  'conversation-uuid',
  'caller-uuid',
  'receiver-uuid',
  'voice' -- or 'video'
);

-- 2. Update call status
SELECT update_call_status('call-uuid', 'accepted');

-- 3. Send signaling data (offer, answer, ICE candidate)
INSERT INTO call_signaling (call_id, sender_id, receiver_id, signal_type, signal_data)
VALUES (
  'call-uuid',
  'sender-uuid',
  'receiver-uuid',
  'offer',
  '{"sdp": "...", "type": "offer"}'::jsonb
);

-- 4. Get user's call history
SELECT * FROM get_user_call_history('user-uuid', 20);

-- 5. Clean old signaling data
SELECT cleanup_old_signaling();
*/

-- =====================================================
-- END OF VOICE/VIDEO CALL SYSTEM
-- =====================================================
