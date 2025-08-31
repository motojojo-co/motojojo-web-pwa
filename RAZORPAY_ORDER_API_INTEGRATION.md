# Razorpay Order API Integration

This document explains the implementation of Razorpay's Order API for better payment capture and security.

## Overview

We've migrated from the direct payment flow to using Razorpay's Order API, which provides:
- Better payment capture rates
- Enhanced security with signature verification
- Improved order tracking and management
- Better error handling and reliability

## Architecture

### 1. Order Creation Flow
```
Client → Supabase Edge Function → Razorpay Order API → Order ID → Client
```

### 2. Payment Flow
```
Client → Razorpay Checkout (with Order ID) → Payment → Signature Verification → Booking Creation
```

## Components

### 1. Supabase Edge Functions

#### `create-order` Function
- **Location**: `supabase/functions/create-order/index.ts`
- **Purpose**: Creates Razorpay orders using the Order API
- **Input**: `{ amount, currency, receipt, notes }`
- **Output**: `{ success, orderId, order }`

#### `verify-payment` Function
- **Location**: `supabase/functions/verify-payment/index.ts`
- **Purpose**: Verifies payment signatures for security
- **Input**: `{ orderId, paymentId, signature }`
- **Output**: `{ success, verified, message }`

### 2. Frontend Service

#### `razorpayService.ts`
- **Location**: `src/services/razorpayService.ts`
- **Functions**:
  - `createRazorpayOrder()`: Creates orders via Edge Function
  - `verifyRazorpayPayment()`: Verifies payments via Edge Function
  - `initializeRazorpayCheckout()`: Initializes checkout with order

### 3. Updated Components

#### `RazorpayButton.tsx`
- Now uses Order API flow
- Includes payment verification
- Better error handling

#### `BookingPage.tsx`
- Updated to use Order API
- Enhanced security with signature verification
- Improved error handling

## Environment Variables

Add these to your Supabase Edge Functions environment:

```bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Implementation Steps

### 1. Deploy Edge Functions

```bash
# Deploy the create-order function
supabase functions deploy create-order

# Deploy the verify-payment function
supabase functions deploy verify-payment
```

### 2. Set Environment Variables

In your Supabase dashboard:
1. Go to Settings → Edge Functions
2. Add the Razorpay environment variables
3. Redeploy the functions

### 3. Update Frontend

The frontend code has been updated to use the new service. No additional changes needed.

## Payment Flow

### Before (Direct Payment)
1. User clicks pay
2. Razorpay checkout opens directly
3. Payment processed
4. Booking created

### After (Order API)
1. User clicks pay
2. **Order created** via Edge Function
3. Razorpay checkout opens with Order ID
4. Payment processed
5. **Payment verified** via Edge Function
6. Booking created

## Benefits

### 1. Better Payment Capture
- Orders are created before payment
- Reduces payment failures
- Better tracking of payment attempts

### 2. Enhanced Security
- Signature verification prevents tampering
- Server-side validation
- Secure key management

### 3. Improved Reliability
- Better error handling
- Retry mechanisms
- Detailed logging

### 4. Better Analytics
- Order tracking
- Payment attempt monitoring
- Detailed transaction logs

## Testing

### Test Mode
Use test keys for development:
```javascript
key: "rzp_test_AIaN0EfXmfZgMk"
```

### Live Mode
Use live keys for production:
```javascript
key: "rzp_live_yAyC4YmewB4VQG"
```

## Error Handling

The new implementation includes comprehensive error handling:

1. **Order Creation Errors**: Handled in Edge Function
2. **Payment Verification Errors**: Signature validation
3. **Network Errors**: Retry mechanisms
4. **User Cancellation**: Graceful handling

## Monitoring

Monitor these metrics:
- Order creation success rate
- Payment verification success rate
- Payment capture rate
- Error rates by type

## Troubleshooting

### Common Issues

1. **Order Creation Fails**
   - Check Razorpay credentials
   - Verify Edge Function deployment
   - Check network connectivity

2. **Payment Verification Fails**
   - Verify signature generation
   - Check key secret configuration
   - Validate payment response

3. **Checkout Doesn't Open**
   - Check Razorpay script loading
   - Verify order ID format
   - Check browser console for errors

### Debug Mode

Enable debug logging in Edge Functions:
```typescript
console.log('Order creation request:', request);
console.log('Payment verification:', { orderId, paymentId, signature });
```

## Migration Notes

- Existing bookings remain unaffected
- New bookings use Order API
- Backward compatibility maintained
- Gradual rollout possible

## Support

For issues related to:
- **Razorpay API**: Contact Razorpay support
- **Edge Functions**: Check Supabase logs
- **Frontend**: Check browser console
- **Integration**: Review this documentation

