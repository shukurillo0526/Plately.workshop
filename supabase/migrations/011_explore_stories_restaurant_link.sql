-- Migration 011: Add restaurant_id to stories table and public view policy
-- =========================================================================

-- 1. Add restaurant_id column to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 2. Create index for fast retrieval of restaurant stories
CREATE INDEX IF NOT EXISTS idx_stories_restaurant_id ON stories(restaurant_id);

-- 3. Ensure public read policy allows viewing active unexpired stories
DROP POLICY IF EXISTS "Public can view active unexpired stories" ON stories;
CREATE POLICY "Public can view active unexpired stories"
ON stories
FOR SELECT
USING (expires_at > now());
