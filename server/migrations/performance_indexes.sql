-- Performance indexes for backend hot paths
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms (farmer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications (user_id, read);
