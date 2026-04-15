-- Complete Messages Table Schema
-- Adds all missing columns required by the chat API.
-- Safe to run multiple times using IF NOT EXISTS.

-- Create messages table with basic structure if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add core message fields
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID NOT NULL,
  ADD COLUMN IF NOT EXISTS sender_id UUID NOT NULL,
  ADD COLUMN IF NOT EXISTS receiver_id UUID NOT NULL,
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add soft delete flags
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN NOT NULL DEFAULT false;

-- Add read status
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Add timestamp for updates
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add conversation_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
      AND constraint_name LIKE '%conversation%'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_conversation
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;

  -- Add sender_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'messages' AND column_name = 'sender_id'
      AND constraint_name LIKE '%sender%'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_sender
      FOREIGN KEY (sender_id) REFERENCES farmers(id) ON DELETE CASCADE;
  END IF;

  -- Add receiver_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'messages' AND column_name = 'receiver_id'
      AND constraint_name LIKE '%receiver%'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_receiver
      FOREIGN KEY (receiver_id) REFERENCES farmers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC)
  WHERE deleted_by_sender = false AND deleted_by_receiver = false;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_visible
  ON messages (conversation_id, created_at DESC)
  WHERE deleted_by_sender = false AND deleted_by_receiver = false;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON messages (receiver_id, read, deleted_by_receiver)
  WHERE read = false AND deleted_by_receiver = false;

CREATE INDEX IF NOT EXISTS idx_messages_sender_deleted
  ON messages (sender_id, deleted_by_sender);
