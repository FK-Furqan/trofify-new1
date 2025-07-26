-- Story Views Migration
-- Run this in your Supabase SQL Editor to add story view tracking

-- Create story_views table
CREATE TABLE IF NOT EXISTS story_views (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at);

-- Add comment for documentation
COMMENT ON TABLE story_views IS 'Tracks which stories have been viewed by which users';
COMMENT ON COLUMN story_views.story_id IS 'Reference to the story that was viewed';
COMMENT ON COLUMN story_views.viewer_id IS 'Reference to the user who viewed the story';
COMMENT ON COLUMN story_views.viewed_at IS 'Timestamp when the story was viewed'; 