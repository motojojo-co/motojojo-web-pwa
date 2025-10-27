-- Create user_subscription_details table for storing questionnaire responses
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_subscription_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.user_memberships(id) ON DELETE CASCADE,
    
    -- Personal Information
    name VARCHAR(255),
    pronouns VARCHAR(50),
    phone_number VARCHAR(20),
    birthday VARCHAR(10), -- MM/DD format
    city VARCHAR(255),
    social_handles TEXT,
    
    -- Personality & Preferences
    mood VARCHAR(500),
    role_in_group VARCHAR(500),
    interests TEXT,
    art_inspiration TEXT,
    
    -- Community Connection
    been_to_gathering VARCHAR(100),
    how_found_us VARCHAR(100),
    why_join_community TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per membership
    UNIQUE(user_id, membership_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_subscription_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription details" ON public.user_subscription_details
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription details" ON public.user_subscription_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription details" ON public.user_subscription_details
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription details" ON public.user_subscription_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscription_details;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_subscription_details_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscription_details_updated_at 
    BEFORE UPDATE ON public.user_subscription_details 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_subscription_details_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_user_id ON public.user_subscription_details(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_membership_id ON public.user_subscription_details(membership_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_city ON public.user_subscription_details(city);
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_created_at ON public.user_subscription_details(created_at);
