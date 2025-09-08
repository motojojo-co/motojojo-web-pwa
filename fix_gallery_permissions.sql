-- Fix RLS policies for gallery_videos table
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all videos" ON gallery_videos;
DROP POLICY IF EXISTS "Users can view their own videos" ON gallery_videos;

-- Create simpler admin policy that doesn't rely on auth.users table
CREATE POLICY "Admins can manage all videos" ON gallery_videos
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        (
            -- Check if user has admin role in their JWT claims
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin' OR
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
        )
    );

-- Users can view their own videos
CREATE POLICY "Users can view their own videos" ON gallery_videos
    FOR SELECT USING (auth.uid() = created_by);

-- Allow authenticated users to insert videos (for admin functionality)
CREATE POLICY "Authenticated users can insert videos" ON gallery_videos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update videos they created
CREATE POLICY "Users can update their own videos" ON gallery_videos
    FOR UPDATE USING (auth.uid() = created_by);

-- Allow authenticated users to delete videos they created
CREATE POLICY "Users can delete their own videos" ON gallery_videos
    FOR DELETE USING (auth.uid() = created_by);

-- Alternative: If the above doesn't work, try this simpler approach
-- Temporarily disable RLS for testing
-- ALTER TABLE gallery_videos DISABLE ROW LEVEL SECURITY;

-- Or create a very permissive policy for admins
-- CREATE POLICY "Allow all for authenticated users" ON gallery_videos
--     FOR ALL USING (auth.uid() IS NOT NULL);
