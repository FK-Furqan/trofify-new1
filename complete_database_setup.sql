-- Trofify Complete Database Setup
-- Run these commands in your Supabase SQL Editor

-- ================================
-- 1. USERS TABLE (base table)
-- ================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('athlete', 'coach', 'fan', 'venue', 'sports_brand')),
  display_name TEXT,
  phone_number TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add display_name column if not already added
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add avatar column if not already added
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Note: users table doesn't have updated_at column, so no trigger needed

-- ================================
-- 2. STORIES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);

-- ================================
-- 2.1. STORY VIEWS TABLE
-- ================================
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

-- ================================
-- 3. POSTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT,
  media_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 4. POST INTERACTIONS TABLES
-- ================================
CREATE TABLE IF NOT EXISTS post_likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_saves (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS post_shares (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 5. USER MEDIA TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_media (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 6. USER TYPE SPECIFIC TABLES
-- ================================

-- Athletes table
CREATE TABLE IF NOT EXISTS athletes (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  sport TEXT,
  level TEXT,
  achievements TEXT,
  date_of_birth DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  sport TEXT,
  experience TEXT,
  certifications TEXT,
  specialization TEXT,
  organization TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fans table
CREATE TABLE IF NOT EXISTS fans (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  favorite_sports TEXT,
  favorite_teams TEXT,
  interests TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  owner_name TEXT,
  venue_name TEXT,
  venue_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  website TEXT,
  facilities TEXT,
  capacity INTEGER,
  description TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sports brands table
CREATE TABLE IF NOT EXISTS sports_brands (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  contact_name TEXT,
  brand_name TEXT,
  company_type TEXT,
  website TEXT,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  product_categories TEXT,
  target_markets TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 7. STORAGE BUCKETS
-- ================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profile-photo', 'profile-photo', true),
  ('post', 'post', true),
  ('story', 'story', true)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- 8. STORAGE POLICIES
-- ================================
-- Enable Row Level Security on storage.objects (required)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations for now (since we're using service key)
CREATE POLICY "Allow all operations on profile-photo" ON storage.objects
  FOR ALL USING (bucket_id = 'profile-photo');

CREATE POLICY "Allow all operations on post" ON storage.objects
  FOR ALL USING (bucket_id = 'post');

CREATE POLICY "Allow all operations on story" ON storage.objects
  FOR ALL USING (bucket_id = 'story');

-- ================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);

-- ================================
-- 10. UPDATE TRIGGERS
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: users table doesn't have updated_at column, so no trigger needed

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 