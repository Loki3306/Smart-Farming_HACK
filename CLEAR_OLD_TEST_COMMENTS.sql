-- Clear old test comments to fix timestamp display issues
-- Run this in Supabase SQL Editor to remove outdated test data

-- Delete all comments that are more than 1 hour old
-- This will remove the old "5h ago" test comments
DELETE FROM post_comments 
WHERE created_at < NOW() - INTERVAL '1 hour';

-- OR if you want to delete ALL comments (complete reset):
-- DELETE FROM post_comments;

-- Verify the deletion
SELECT COUNT(*) as remaining_comments FROM post_comments;
SELECT * FROM post_comments ORDER BY created_at DESC LIMIT 5;
