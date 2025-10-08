-- Add custom_tags JSONB column to events table for arbitrary tagged details
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS custom_tags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.events.custom_tags IS 'Array of custom tagged details for the event. Each item: {"tag": string, "label": string, "value": string, "link": string | null}';







