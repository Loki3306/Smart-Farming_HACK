-- =====================================================
-- REAL-TIME CHAT SYSTEM
-- Expert-Farmer Messaging Platform
-- Created: December 26, 2025
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONVERSATIONS TABLE
-- Tracks message threads between farmers and experts
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL,
  expert_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure both participants exist in farmers table
  CONSTRAINT fk_conversations_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_expert FOREIGN KEY (expert_id) REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Ensure farmer and expert are different people
  CONSTRAINT check_different_participants CHECK (farmer_id != expert_id),
  
  -- Only one conversation per farmer-expert pair
  CONSTRAINT unique_conversation UNIQUE(farmer_id, expert_id)
);

-- =====================================================
-- 2. MESSAGES TABLE
-- Stores all messages in conversations
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_receiver BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Validation
  CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0 OR image_url IS NOT NULL),
  CONSTRAINT check_different_sender_receiver CHECK (sender_id != receiver_id)
);

-- =====================================================
-- 3. USER PRESENCE TABLE
-- Tracks online/offline status of users
-- =====================================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_presence_user FOREIGN KEY (user_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. TYPING INDICATORS TABLE
-- Tracks who is typing in which conversation (ephemeral)
-- =====================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (conversation_id, user_id),
  
  CONSTRAINT fk_typing_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_typing_user FOREIGN KEY (user_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_farmer_id ON conversations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_expert_id ON conversations(expert_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_unread_by_receiver ON messages(receiver_id, read) WHERE read = FALSE;

-- User presence indexes
CREATE INDEX IF NOT EXISTS idx_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen DESC);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_user ON typing_indicators(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations" 
ON conversations 
FOR SELECT 
USING (farmer_id = auth.uid() OR expert_id = auth.uid());

CREATE POLICY "Users can create conversations they participate in" 
ON conversations 
FOR INSERT 
WITH CHECK (farmer_id = auth.uid() OR expert_id = auth.uid());

CREATE POLICY "Users can update their own conversations" 
ON conversations 
FOR UPDATE 
USING (farmer_id = auth.uid() OR expert_id = auth.uid());

-- Messages: Users can only see messages in their conversations
CREATE POLICY "Users can view messages in their conversations" 
ON messages 
FOR SELECT 
USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY "Users can send messages" 
ON messages 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" 
ON messages 
FOR UPDATE 
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can delete their own messages" 
ON messages 
FOR DELETE 
USING (sender_id = auth.uid());

-- User presence: Everyone can view, users can update their own
CREATE POLICY "Anyone can view presence" 
ON user_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert presence" 
ON user_presence 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update presence" 
ON user_presence 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete presence" 
ON user_presence 
FOR DELETE 
USING (true);

-- Typing indicators: Users can view and update in their conversations
CREATE POLICY "Users can view typing in their conversations" 
ON typing_indicators 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE farmer_id = auth.uid() OR expert_id = auth.uid()
  )
);

CREATE POLICY "Users can manage typing indicators" 
ON typing_indicators 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE receiver_id = p_user_id 
      AND read = FALSE
      AND deleted_by_receiver = FALSE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get unread count per conversation for a user
CREATE OR REPLACE FUNCTION get_conversation_unread_counts(p_user_id UUID)
RETURNS TABLE(conversation_id UUID, unread_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(*)::INTEGER AS unread_count
  FROM messages m
  WHERE m.receiver_id = p_user_id 
    AND m.read = FALSE
    AND m.deleted_by_receiver = FALSE
  GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Mark all messages in conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE messages
  SET 
    read = TRUE,
    read_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Function: Clean old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-set user status to away after 5 minutes
CREATE OR REPLACE FUNCTION auto_set_away_status()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_presence
  SET 
    status = 'away',
    updated_at = CURRENT_TIMESTAMP
  WHERE status = 'online'
    AND updated_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-set user status to offline after 15 minutes
CREATE OR REPLACE FUNCTION auto_set_offline_status()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_presence
  SET 
    status = 'offline',
    last_seen = updated_at,
    updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('online', 'away')
    AND updated_at < NOW() - INTERVAL '15 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR EASIER QUERIES
-- =====================================================

-- View: Conversation details with participant info
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
  c.id AS conversation_id,
  c.farmer_id,
  c.expert_id,
  c.last_message_at,
  c.last_message_preview,
  c.created_at,
  f1.name AS farmer_name,
  f1.phone AS farmer_phone,
  f2.name AS expert_name,
  f2.phone AS expert_phone
FROM conversations c
JOIN farmers f1 ON c.farmer_id = f1.id
JOIN farmers f2 ON c.expert_id = f2.id
ORDER BY c.last_message_at DESC;

-- View: Messages with sender/receiver info
CREATE OR REPLACE VIEW message_details AS
SELECT 
  m.id AS message_id,
  m.conversation_id,
  m.sender_id,
  m.receiver_id,
  m.content,
  m.image_url,
  m.read,
  m.read_at,
  m.created_at,
  sender.name AS sender_name,
  sender.phone AS sender_phone,
  receiver.name AS receiver_name,
  receiver.phone AS receiver_phone
FROM messages m
JOIN farmers sender ON m.sender_id = sender.id
JOIN farmers receiver ON m.receiver_id = receiver.id
ORDER BY m.created_at DESC;

-- =====================================================
-- SAMPLE DATA FOR TESTING (COMMENTED OUT)
-- =====================================================

/*
-- Insert test users (assuming they exist in farmers table)
-- INSERT INTO farmers (id, name, phone) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'Rajesh Kumar', '9876543210'),
-- ('00000000-0000-0000-0000-000000000002', 'Dr. Priya Sharma', '9876543211');

-- Create a test conversation
INSERT INTO conversations (farmer_id, expert_id) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Send test messages
INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES 
((SELECT id FROM conversations LIMIT 1), 
 '00000000-0000-0000-0000-000000000001', 
 '00000000-0000-0000-0000-000000000002', 
 'Hello, I need help with my wheat crop!');

-- Set user presence
INSERT INTO user_presence (user_id, status) VALUES 
('00000000-0000-0000-0000-000000000001', 'online'),
('00000000-0000-0000-0000-000000000002', 'online')
ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
*/

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- 1. Create a new conversation
INSERT INTO conversations (farmer_id, expert_id)
VALUES ('farmer-uuid', 'expert-uuid')
ON CONFLICT (farmer_id, expert_id) DO NOTHING
RETURNING id;

-- 2. Send a message
INSERT INTO messages (conversation_id, sender_id, receiver_id, content)
VALUES ('conversation-uuid', 'sender-uuid', 'receiver-uuid', 'Message content');

-- 3. Get user's conversations with unread counts
SELECT 
  c.*,
  COALESCE(u.unread_count, 0) AS unread_count
FROM conversations c
LEFT JOIN get_conversation_unread_counts('user-uuid') u ON c.id = u.conversation_id
WHERE c.farmer_id = 'user-uuid' OR c.expert_id = 'user-uuid'
ORDER BY c.last_message_at DESC;

-- 4. Get messages in a conversation (paginated)
SELECT * FROM messages
WHERE conversation_id = 'conversation-uuid'
  AND (deleted_by_sender = FALSE OR sender_id != 'current-user-uuid')
  AND (deleted_by_receiver = FALSE OR receiver_id != 'current-user-uuid')
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- 5. Mark conversation as read
SELECT mark_conversation_read('conversation-uuid', 'user-uuid');

-- 6. Update user presence
INSERT INTO user_presence (user_id, status)
VALUES ('user-uuid', 'online')
ON CONFLICT (user_id) 
DO UPDATE SET status = 'online', updated_at = NOW();

-- 7. Set typing indicator
INSERT INTO typing_indicators (conversation_id, user_id, is_typing)
VALUES ('conversation-uuid', 'user-uuid', TRUE)
ON CONFLICT (conversation_id, user_id)
DO UPDATE SET is_typing = TRUE, updated_at = NOW();

-- 8. Get total unread count
SELECT get_unread_message_count('user-uuid');

-- 9. Cleanup old typing indicators (run periodically)
SELECT cleanup_old_typing_indicators();

-- 10. Auto-update presence statuses (run periodically)
SELECT auto_set_away_status();
SELECT auto_set_offline_status();
*/

-- =====================================================
-- MAINTENANCE NOTES
-- =====================================================

/*
PERIODIC TASKS (via cron or scheduled jobs):

1. Clean old typing indicators (every 30 seconds):
   SELECT cleanup_old_typing_indicators();

2. Update user presence statuses (every minute):
   SELECT auto_set_away_status();
   SELECT auto_set_offline_status();

3. Archive old messages (monthly, optional):
   -- Move messages older than 6 months to archive table

4. Clean soft-deleted messages (weekly):
   DELETE FROM messages 
   WHERE deleted_by_sender = TRUE 
     AND deleted_by_receiver = TRUE 
     AND created_at < NOW() - INTERVAL '30 days';

MONITORING:

1. Watch message table size
2. Monitor index usage
3. Check RLS policy performance
4. Track real-time subscription load
*/

-- =====================================================
-- ENABLE REALTIME REPLICATION
-- Required for Supabase real-time subscriptions to work
-- =====================================================

-- Enable realtime for all chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- =====================================================
-- END OF CHAT SYSTEM SCHEMA
-- =====================================================
