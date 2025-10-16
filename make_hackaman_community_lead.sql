-- Make hackaman4@gmail.com a community lead
-- Run this query in your Supabase SQL Editor

-- First, update the user's role to community_lead
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
