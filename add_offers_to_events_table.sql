-- Add offers column to events table
-- Run this in your Supabase SQL Editor

-- 1. Add offers column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS offers JSONB DEFAULT '[]'::jsonb;

-- 2. Add a comment to describe the column
COMMENT ON COLUMN public.events.offers IS 'JSON array of event offers with structure: [{offer_type, title, description, price_adjustment, min_quantity, max_quantity, group_size, conditions, is_active, valid_from, valid_until}]';

-- 3. Create an index on the offers column for better performance
CREATE INDEX IF NOT EXISTS idx_events_offers ON public.events USING GIN (offers);

-- 4. Update existing events to have empty offers array if they don't have one
UPDATE public.events 
SET offers = '[]'::jsonb 
WHERE offers IS NULL;

-- 5. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'events' 
AND column_name = 'offers';

-- 6. Show sample data structure
SELECT id, title, offers 
FROM public.events 
LIMIT 3;

