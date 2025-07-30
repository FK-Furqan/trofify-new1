-- Trofify Supabase Storage Setup
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

-- Create the get_or_create_conversation function
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_uuid UUID, user2_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- First, try to find an existing conversation between these two users
    SELECT id INTO conversation_id
    FROM conversations
    WHERE (user1_id = user1_uuid AND user2_id = user2_uuid)
       OR (user1_id = user2_uuid AND user2_id = user1_uuid)
    LIMIT 1;
    
    -- If no conversation exists, create a new one
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
        VALUES (user1_uuid, user2_uuid, NOW(), NOW())
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$; 

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at(); 