-- Create event_comments table
CREATE TABLE IF NOT EXISTS event_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE, -- For replies
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_user_id ON event_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON event_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_comments_parent_comment_id ON event_comments(parent_comment_id);

-- Enable RLS (Row Level Security)
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for event_comments
-- Users can view all comments for events they have access to
CREATE POLICY "Users can view event comments" ON event_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_comments.event_id 
      AND (
        NOT events.is_private 
        OR EXISTS (
          SELECT 1 
          FROM event_invitations ei
          JOIN users u ON u.email = ei.user_email
          WHERE ei.event_id = events.id 
          AND u.id = auth.uid()
          AND ei.status = 'accepted'
        )
      )
    )
  );

-- Users can insert comments for events they have access to
CREATE POLICY "Users can insert event comments" ON event_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_comments.event_id 
      AND (
        NOT events.is_private 
        OR EXISTS (
          SELECT 1 
          FROM event_invitations ei
          JOIN users u ON u.email = ei.user_email
          WHERE ei.event_id = events.id 
          AND u.id = auth.uid()
          AND ei.status = 'accepted'
        )
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON event_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (soft delete by setting is_deleted = true)
CREATE POLICY "Users can delete own comments" ON event_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_comments_updated_at 
  BEFORE UPDATE ON event_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
