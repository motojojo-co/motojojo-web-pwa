-- Safe migration to fix community lead setup
-- This handles existing objects gracefully

-- Update the role constraint to include community_lead (if not already done)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'host', 'community_lead'));

-- Add community_lead specific fields to users table (if not already added)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS community_lead_username VARCHAR(50) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS community_lead_city VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS community_lead_bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS community_lead_is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS community_lead_is_verified BOOLEAN DEFAULT false;

-- Create community_lead_events table (if not exists)
CREATE TABLE IF NOT EXISTS public.community_lead_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_lead_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Create community_lead_invitations table (if not exists)
CREATE TABLE IF NOT EXISTS public.community_lead_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.users(id),
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(email, status)
);

-- Create community_lead_activity table (if not exists)
CREATE TABLE IF NOT EXISTS public.community_lead_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_lead_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables (if not already enabled)
ALTER TABLE public.community_lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_lead_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_lead_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Community leads can view their own events" ON public.community_lead_events;
DROP POLICY IF EXISTS "Admins can manage all community lead events" ON public.community_lead_events;
DROP POLICY IF EXISTS "Admins can manage community lead invitations" ON public.community_lead_invitations;
DROP POLICY IF EXISTS "Community leads can view their own activity" ON public.community_lead_activity;
DROP POLICY IF EXISTS "System can insert community lead activity" ON public.community_lead_activity;

-- Recreate RLS Policies
CREATE POLICY "Community leads can view their own events" ON public.community_lead_events
    FOR SELECT USING (
        community_lead_id = auth.uid()::uuid OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin')
    );

CREATE POLICY "Admins can manage all community lead events" ON public.community_lead_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin')
    );

CREATE POLICY "Admins can manage community lead invitations" ON public.community_lead_invitations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin')
    );

CREATE POLICY "Community leads can view their own activity" ON public.community_lead_activity
    FOR SELECT USING (
        community_lead_id = auth.uid()::uuid OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin')
    );

CREATE POLICY "System can insert community lead activity" ON public.community_lead_activity
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_community_lead_events_lead_id ON public.community_lead_events(community_lead_id);
CREATE INDEX IF NOT EXISTS idx_community_lead_events_event_id ON public.community_lead_events(event_id);
CREATE INDEX IF NOT EXISTS idx_community_lead_activity_lead_id ON public.community_lead_activity(community_lead_id);
CREATE INDEX IF NOT EXISTS idx_community_lead_activity_created_at ON public.community_lead_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_users_community_lead_username ON public.users(community_lead_username);

-- Now update your user to be a community lead
UPDATE public.users 
SET 
    role = 'community_lead',
    community_lead_username = 'hackaman4',
    community_lead_city = '',
    community_lead_bio = '',
    community_lead_is_active = true,
    community_lead_is_verified = false,
    updated_at = NOW()
WHERE email = 'hackaman4@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    full_name,
    role,
    community_lead_username,
    community_lead_city,
    community_lead_is_active,
    community_lead_is_verified,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'hackaman4@gmail.com';
