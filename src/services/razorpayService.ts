import { supabase } from "@/integrations/supabase/client";

export interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  order: {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, any>;
    created_at: number;
  };
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified: boolean;
  message?: string;
  error?: string;
}

/**
 * Create a Razorpay order using the Order API
 */
export const createRazorpayOrder = async (request: CreateOrderRequest): Promise<CreateOrderResponse> => {
  try {
    console.log('=== FRONTEND: Creating Razorpay Order ===');
    console.log('Request:', JSON.stringify(request, null, 2));
    
    // Use direct fetch instead of supabase.functions.invoke
    const response = await fetch('https://vibruvwwwxqtagmlkodq.supabase.co/functions/v1/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnJ1dnd3d3hxdGFnbWxrb2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjEyODIsImV4cCI6MjA2MDIzNzI4Mn0.7s_NqBKDjAvtfr7GKPPMhqizUh9VbAfOY4j2lrE3p7A'
      },
      body: JSON.stringify(request)
    });

    console.log('Direct fetch response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Order created successfully:', data);
    return data as CreateOrderResponse;
  } catch (error) {
    console.error('Error in createRazorpayOrder:', error);
    throw error;
  }
};

/**
 * Verify a Razorpay payment using signature verification
 */
export const verifyRazorpayPayment = async (request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
  try {
    // Use direct fetch instead of supabase.functions.invoke
    const response = await fetch('https://vibruvwwwxqtagmlkodq.supabase.co/functions/v1/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnJ1dnd3d3hxdGFnbWxrb2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjEyODIsImV4cCI6MjA2MDIzNzI4Mn0.7s_NqBKDjAvtfr7GKPPMhqizUh9VbAfOY4j2lrE3p7A'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error verifying payment:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data as VerifyPaymentResponse;
  } catch (error) {
    console.error('Error in verifyRazorpayPayment:', error);
    throw error;
  }
};

/**
 * Initialize Razorpay checkout with order
 */
export const initializeRazorpayCheckout = (
  orderId: string,
  options: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
    };
    handler: (response: any) => void;
    modal?: {
      ondismiss?: () => void;
    };
  }
) => {
  // Load Razorpay script if not already loaded
  const loadRazorpayScript = (callback: () => void) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = callback;
    document.head.appendChild(script);
  };

  return new Promise<void>((resolve, reject) => {
    loadRazorpayScript(() => {
      try {
        const rzpOptions = {
          ...options,
          order_id: orderId,
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

