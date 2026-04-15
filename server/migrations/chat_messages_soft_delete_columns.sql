-- Ensure chat message soft-delete flags exist for API queries.
-- Safe to run multiple times.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_visible
  ON messages (conversation_id, created_at DESC)
  WHERE deleted_by_sender = false AND deleted_by_receiver = false;
