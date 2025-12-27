-- Add message_type column to messages table
-- This allows system messages (like "Conversation shifted to WhatsApp")
-- to be displayed differently from regular user messages

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' 
CHECK (message_type IN ('text', 'system', 'image'));

-- Update existing records to have 'text' type
UPDATE messages 
SET message_type = 'text' 
WHERE message_type IS NULL;

-- Add index for filtering by message type
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
