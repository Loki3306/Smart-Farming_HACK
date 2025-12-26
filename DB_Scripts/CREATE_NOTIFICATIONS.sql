-- =====================================================
-- NOTIFICATIONS SYSTEM
-- Real-time notifications for user interactions
-- =====================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'share', 'follow', 'message')),
  post_id UUID,
  comment_id UUID,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_comment FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
  CONSTRAINT check_not_self_notification CHECK (user_id != actor_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- 3. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy
CREATE POLICY "Allow all on notifications" 
ON notifications 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Helper function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Helper function: Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Helper function: Clean old read notifications (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for notification details with user info
CREATE OR REPLACE VIEW notification_details AS
SELECT 
  n.id,
  n.user_id,
  n.actor_id,
  n.type,
  n.post_id,
  n.comment_id,
  n.message,
  n.read,
  n.created_at,
  f.name AS actor_name,
  f.phone AS actor_phone
FROM notifications n
JOIN farmers f ON n.actor_id = f.id
ORDER BY n.created_at DESC;

-- =====================================================
-- USAGE NOTES:
-- 
-- Create notification:
-- INSERT INTO notifications (user_id, actor_id, type, post_id, message)
-- VALUES ('user-uuid', 'actor-uuid', 'reaction', 'post-uuid', 'liked your post');
--
-- Get user notifications with details:
-- SELECT * FROM notification_details WHERE user_id = 'user-uuid' ORDER BY created_at DESC LIMIT 20;
--
-- Mark notification as read:
-- UPDATE notifications SET read = TRUE WHERE id = 'notification-uuid';
--
-- Mark all as read:
-- SELECT mark_all_notifications_read('user-uuid');
--
-- Get unread count:
-- SELECT get_unread_notification_count('user-uuid');
--
-- Clean old notifications:
-- SELECT cleanup_old_notifications();
-- =====================================================
