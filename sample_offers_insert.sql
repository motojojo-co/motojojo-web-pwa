-- Sample queries to insert offers directly into events table
-- Run these in your Supabase SQL Editor

-- 1. Example: Add offers to a specific event (replace EVENT_ID with your actual event ID)
UPDATE public.events 
SET offers = '[
  {
    "id": "offer-1",
    "offer_type": "add_person",
    "title": "Add 450 for +1",
    "description": "Add one additional person for ₹450",
    "price_adjustment": 450,
    "min_quantity": 1,
    "max_quantity": null,
    "group_size": 2,
    "conditions": {},
    "is_active": true,
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": null
  },
  {
    "id": "offer-2", 
    "offer_type": "group_discount",
    "title": "Group of 4 - ₹500 each",
    "description": "Special rate for groups of 4 people",
    "price_adjustment": 500,
    "min_quantity": 4,
    "max_quantity": 10,
    "group_size": 4,
    "conditions": {},
    "is_active": true,
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": null
  },
  {
    "id": "offer-3",
    "offer_type": "student_discount",
    "title": "Student Flat Rate - ₹499",
    "description": "Special student pricing with ID verification required",
    "price_adjustment": 499,
    "min_quantity": 1,
    "max_quantity": 1,
    "group_size": 1,
    "conditions": {"requires_student_id": true},
    "is_active": true,
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": null
  }
]'::jsonb
WHERE id = 'YOUR_EVENT_ID_HERE';

-- 2. Example: Add a single offer to an event
UPDATE public.events 
SET offers = offers || '[
  {
    "id": "offer-4",
    "offer_type": "women_flash_sale",
    "title": "Women Friday Special",
    "description": "Special flash sale for women every Friday for 2 hours. Single ticket only.",
    "price_adjustment": 0,
    "min_quantity": 1,
    "max_quantity": 1,
    "group_size": 1,
    "conditions": {"women_only": true, "friday_only": true, "single_ticket": true},
    "is_active": true,
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": null
  }
]'::jsonb
WHERE id = 'YOUR_EVENT_ID_HERE';

-- 3. Example: Remove a specific offer from an event
UPDATE public.events 
SET offers = (
  SELECT jsonb_agg(offer) 
  FROM jsonb_array_elements(offers) AS offer 
  WHERE offer->>'id' != 'offer-1'
)
WHERE id = 'YOUR_EVENT_ID_HERE';

-- 4. Example: Update an existing offer
UPDATE public.events 
SET offers = jsonb_replace(
  offers,
  '{0,price_adjustment}',
  '600'::jsonb
)
WHERE id = 'YOUR_EVENT_ID_HERE' 
AND offers->0->>'id' = 'offer-1';

-- 5. Example: Toggle offer active status
UPDATE public.events 
SET offers = jsonb_replace(
  offers,
  '{0,is_active}',
  'false'::jsonb
)
WHERE id = 'YOUR_EVENT_ID_HERE' 
AND offers->0->>'id' = 'offer-1';

-- 6. View all events with their offers
SELECT 
  id,
  title,
  jsonb_array_length(offers) as offers_count,
  offers
FROM public.events 
WHERE jsonb_array_length(offers) > 0
ORDER BY created_at DESC;

