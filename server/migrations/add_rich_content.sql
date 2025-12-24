-- Add rich content column to course_lessons table
-- This column stores JSON content for text lessons (articles, tips, etc.)

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_lessons' AND column_name = 'content_data'
    ) THEN
        ALTER TABLE course_lessons ADD COLUMN content_data JSONB DEFAULT NULL;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN course_lessons.content_data IS 'Rich JSON content for text lessons including article sections, tips, action items, etc.';
