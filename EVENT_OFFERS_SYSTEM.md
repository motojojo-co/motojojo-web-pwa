# Event Offers System

## Overview
The Event Offers System allows administrators to create flexible pricing options and special deals for events. This system supports various types of offers including group discounts, add-on pricing, student discounts, and special promotional offers.

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of create_event_offers_table.sql
```

### 2. Features

#### Offer Types Supported:
1. **Transaction of Razorpay over and Above** - Additional charges for payment processing
2. **Add Person (+1, +3, etc.)** - Additional person pricing
3. **Group Discount** - Special rates for groups
4. **No STAG** - Restrictions on single entries
5. **Student Discount** - Special pricing for students with ID verification
6. **Flat Rate** - Fixed pricing regardless of base price
7. **Women Flash Sale** - Special time-limited offers for women

#### Quick Templates Available:
- Add 450 for +1 person
- Add 400 for +3 people
- Add 750 for +1 person (premium)
- Group of 4 - ₹500 each
- Student Flat Rate - ₹499
- Women Flash Sale - Friday 2 Hours

### 3. How to Use

#### Creating Events with Offers:
1. Go to Admin Dashboard → Events tab
2. Click "Create Event"
3. Fill in the basic event details
4. Scroll down to the "Event Offers" section
5. Click "Add Offer" to create custom offers or use quick templates
6. Configure offer details:
   - **Offer Type**: Select from predefined types
   - **Title**: Display name for the offer
   - **Description**: Additional details about the offer
   - **Price Adjustment**: Amount to add/subtract from base price
   - **Min/Max Quantity**: Quantity restrictions
   - **Group Size**: Number of people the offer applies to
   - **Active Status**: Enable/disable the offer

#### Editing Existing Events:
1. Find the event in the events list
2. Click the edit button
3. The offers section will show existing offers
4. Add, edit, or delete offers as needed

### 4. Offer Examples

#### Example 1: Add Person Offer
- **Type**: Add Person
- **Title**: "Add +1 Person"
- **Price Adjustment**: 450
- **Min Quantity**: 1
- **Group Size**: 2
- **Description**: "Add one additional person for ₹450"

#### Example 2: Group Discount
- **Type**: Group Discount
- **Title**: "Group of 4 Special Rate"
- **Price Adjustment**: 500
- **Min Quantity**: 4
- **Group Size**: 4
- **Description**: "Special rate for groups of 4 people at ₹500 each"

#### Example 3: Student Discount
- **Type**: Flat Rate
- **Title**: "Student Pricing"
- **Price Adjustment**: 499
- **Min Quantity**: 1
- **Group Size**: 1
- **Description**: "Special student pricing with ID verification required"

#### Example 4: Women Flash Sale
- **Type**: Women Flash Sale
- **Title**: "Friday Women Special"
- **Price Adjustment**: 0 (or discount amount)
- **Min Quantity**: 1
- **Max Quantity**: 1
- **Group Size**: 1
- **Description**: "Special flash sale for women every Friday for 2 hours. Single ticket only."

### 5. Technical Details

#### Database Schema:
```sql
CREATE TABLE public.event_offers (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  offer_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  price_adjustment DECIMAL(10,2),
  min_quantity INTEGER,
  max_quantity INTEGER,
  group_size INTEGER,
  conditions JSONB,
  is_active BOOLEAN,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### API Endpoints:
- `getEventOffers(eventId)` - Get all offers for an event
- `createEventOffer(offerData)` - Create a new offer
- `updateEventOffer(offerData)` - Update an existing offer
- `deleteEventOffer(offerId)` - Delete an offer
- `toggleOfferStatus(offerId, isActive)` - Enable/disable an offer

### 6. Integration with Booking System

The offers system is designed to integrate with the existing booking and payment flow. When users book tickets, the system can:

1. Display available offers based on quantity selected
2. Apply appropriate pricing adjustments
3. Validate offer conditions (group size, quantity limits, etc.)
4. Handle special offers like student discounts or women-only sales

### 7. Future Enhancements

Potential improvements to consider:
- Time-based offers (flash sales with specific time windows)
- User-specific offers (based on membership, previous bookings)
- Promo code integration
- Automatic offer application based on cart contents
- Offer usage analytics and reporting

