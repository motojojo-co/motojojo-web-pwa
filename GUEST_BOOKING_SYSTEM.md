# Guest Booking System Implementation

## Overview
This document describes the implementation of a guest booking system that allows users to book event tickets without creating an account or signing in.

## Changes Made

### 1. SignInSignUp Page (`src/pages/SignInSignUp.tsx`)
- Added a "Continue as Guest" button below the "Continue with Google" button
- The guest button has a distinct outline style with violet border
- Added `handleGuestLogin` function that redirects users directly to the booking page
- Imported the `User` icon from lucide-react for the guest button

### 2. BookingPage (`src/pages/BookingPage.tsx`)
- Removed the authentication requirement check in `handleSubmit`
- Modified booking creation to handle both authenticated and guest users
- Added `is_guest_booking` field to track guest bookings
- Set `user_id` to `null` for guest users
- Added guest user notice above the booking form
- Updated button text to show "Book as Guest" for unauthenticated users

### 3. Database Changes (`add_guest_booking_column.sql`)
- Added `is_guest_booking` boolean column to the `bookings` table
- Set default value to `false`
- Added index for better performance
- Added descriptive comment for the column

## How It Works

### Guest User Flow
1. User clicks "Book Now" on an event
2. If not authenticated, redirected to `/auth?redirect=/book/${eventId}`
3. On the auth page, user can choose:
   - Continue with Google (existing flow)
   - Continue as Guest (new flow)
4. If "Continue as Guest" is selected, user goes directly to booking page
5. Guest user fills out booking form with their details
6. Booking is created with `user_id = null` and `is_guest_booking = true`
7. Tickets are sent to the guest's email address

### Database Schema
```sql
-- Bookings table now supports guest users
ALTER TABLE public.bookings 
ADD COLUMN is_guest_booking BOOLEAN DEFAULT false;

-- Guest bookings will have:
-- user_id: NULL
-- is_guest_booking: true
-- All other fields populated normally
```

## Benefits
- **Improved User Experience**: Users can book tickets without creating accounts
- **Higher Conversion**: Reduces friction in the booking process
- **Flexibility**: Supports both authenticated and guest users
- **Tracking**: Clear identification of guest vs. authenticated bookings

## Security Considerations
- Guest users can only book tickets, not access user-specific features
- Payment processing remains secure through Razorpay
- Email verification ensures tickets reach the correct recipient
- No access to user profile or booking history for guests

## Future Enhancements
- Guest user conversion to registered users
- Guest booking management system
- Analytics on guest vs. authenticated bookings
- Guest user support and ticket retrieval

## Testing
1. Test guest booking flow without authentication
2. Verify guest bookings are marked correctly in database
3. Ensure email delivery works for guest users
4. Test payment processing for guest users
5. Verify guest users cannot access protected routes

## Files Modified
- `src/pages/SignInSignUp.tsx` - Added guest login button
- `src/pages/BookingPage.tsx` - Modified to handle guest users
- `add_guest_booking_column.sql` - Database migration script
- `GUEST_BOOKING_SYSTEM.md` - This documentation file
