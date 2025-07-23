-- TrofiFy Supabase Storage Setup
-- Run these commands in your Supabase SQL Editor

-- 1. Add display_name column to users table (if not already added)
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Fix the stories table to have proper foreign key constraint
-- First check if the constraint exists, if not add it
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'stories_user_id_fkey'
        AND table_name = 'stories'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE stories 
        ADD CONSTRAINT stories_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create storage buckets (simplified version without auth policies)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profile-photo', 'profile-photo', true),
  ('post', 'post', true),
  ('story', 'story', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security on storage.objects (required)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Create simple policies that allow all operations for now (since we're using service key)
CREATE POLICY IF NOT EXISTS "Allow all operations on profile-photo" ON storage.objects
  FOR ALL USING (bucket_id = 'profile-photo');

CREATE POLICY IF NOT EXISTS "Allow all operations on post" ON storage.objects
  FOR ALL USING (bucket_id = 'post');

CREATE POLICY IF NOT EXISTS "Allow all operations on story" ON storage.objects
  FOR ALL USING (bucket_id = 'story'); 