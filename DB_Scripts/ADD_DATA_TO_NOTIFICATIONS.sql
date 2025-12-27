-- =====================================================
-- ADD DATA COLUMN TO NOTIFICATIONS
-- Store additional JSON data (like recommendations)
-- =====================================================

-- 1. Add data column (JSONB for flexible storage)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

-- 2. Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING GIN (data);

-- 3. Update the notification_details view to include data column
CREATE OR REPLACE VIEW notification_details AS
SELECT 
  n.id,
  n.user_id,
  n.actor_id,
  n.type,
  n.post_id,
  n.comment_id,
  n.message,
  n.data,
  n.read,
  n.created_at,
  f.name AS actor_name,
  f.phone AS actor_phone
FROM notifications n
JOIN farmers f ON n.actor_id = f.id;

-- 4. Update type check to include 'recommendation'
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'share', 'follow', 'message', 'recommendation'));

-- Done! Notifications can now store rich data like recommendation cards
