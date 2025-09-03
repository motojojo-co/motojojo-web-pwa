-- Add guest booking column to bookings table
-- Run this in your Supabase SQL Editor

-- 1. Add is_guest_booking column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_guest_booking BOOLEAN DEFAULT false;

-- 2. Add a comment to describe the column
COMMENT ON COLUMN public.bookings.is_guest_booking IS 'Indicates whether this booking was made by a guest user (not authenticated)';

-- 3. Update existing bookings to have is_guest_booking = false (assuming they were all made by authenticated users)
UPDATE public.bookings 
SET is_guest_booking = false 
WHERE is_guest_booking IS NULL;

-- 4. Create an index on the is_guest_booking column for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_is_guest_booking ON public.bookings(is_guest_booking);

-- 5. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bookings' 
AND column_name = 'is_guest_booking';

-- 6. Show sample data structure (using booking_date instead of created_at)
SELECT id, user_id, name, email, is_guest_booking, booking_date 
FROM public.bookings 
ORDER BY booking_date DESC 
LIMIT 5;
