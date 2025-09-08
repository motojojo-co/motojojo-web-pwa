-- Create gallery_videos table
CREATE TABLE IF NOT EXISTS gallery_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_url VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(50) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration INTEGER, -- in seconds
  category VARCHAR(100) DEFAULT 'general',
  tags TEXT[], -- array of tags
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_videos_category ON gallery_videos(category);
CREATE INDEX IF NOT EXISTS idx_gallery_videos_created_at ON gallery_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_videos_is_public ON gallery_videos(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_videos_is_featured ON gallery_videos(is_featured);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gallery_videos_updated_at 
    BEFORE UPDATE ON gallery_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE gallery_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public videos are visible to everyone
CREATE POLICY "Public videos are viewable by everyone" ON gallery_videos
    FOR SELECT USING (is_public = true);

-- Admins can do everything
CREATE POLICY "Admins can manage all videos" ON gallery_videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
        )
    );

-- Users can view their own videos
CREATE POLICY "Users can view their own videos" ON gallery_videos
    FOR SELECT USING (auth.uid() = created_by);
