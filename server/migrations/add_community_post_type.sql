-- Add missing post_type column used by community routes.
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) NOT NULL DEFAULT 'update';

-- Keep values aligned with API type expectations.
ALTER TABLE community_posts
DROP CONSTRAINT IF EXISTS community_posts_post_type_check;

ALTER TABLE community_posts
ADD CONSTRAINT community_posts_post_type_check
CHECK (post_type IN ('success', 'question', 'problem', 'update'));
