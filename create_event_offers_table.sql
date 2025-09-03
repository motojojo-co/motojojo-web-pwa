-- Create event offers table
-- Run this in your Supabase SQL Editor

-- Create event_offers table
CREATE TABLE IF NOT EXISTS public.event_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  offer_type VARCHAR(50) NOT NULL CHECK (offer_type IN (
    'razorpay_above',
    'add_person',
    'group_discount',
    'no_stag',
    'student_discount',
    'flat_rate',
    'women_flash_sale'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  group_size INTEGER DEFAULT 1,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.event_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for event offers
CREATE POLICY "Event offers are viewable by everyone" ON public.event_offers
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all event offers" ON public.event_offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id::text = auth.uid()::text AND users.role = 'admin'
        )
    );

-- Simplified policy - allow authenticated users to manage offers
CREATE POLICY "Authenticated users can manage event offers" ON public.event_offers
    FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_offers_event_id ON public.event_offers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_offers_offer_type ON public.event_offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_event_offers_is_active ON public.event_offers(is_active);

-- Create trigger for updated_at (function should already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_offers_updated_at
    BEFORE UPDATE ON public.event_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_offers;
