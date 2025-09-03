-- Test script to check event_offers table
-- Run this in your Supabase SQL Editor

-- 1. Check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'event_offers'
);

-- 2. If table exists, show its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'event_offers'
ORDER BY ordinal_position;

-- 3. Check if there are any offers
SELECT COUNT(*) as total_offers FROM public.event_offers;

-- 4. Show sample offers data
SELECT * FROM public.event_offers LIMIT 5;

-- 5. Check if the specific event has offers
-- Replace '122a0d0b-8dff-45b0-bda1-982b11895f47' with your actual event ID
SELECT * FROM public.event_offers 
WHERE event_id = '122a0d0b-8dff-45b0-bda1-982b11895f47';

