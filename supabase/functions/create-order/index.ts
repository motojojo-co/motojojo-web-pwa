import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== CREATE ORDER FUNCTION CALLED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { amount, currency = 'INR', receipt, notes } = body

    console.log('Extracted values:', { amount, currency, receipt, notes })

    if (!amount) {
      console.log('Amount is missing or zero')
      return new Response(
        JSON.stringify({ error: 'Amount is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    console.log('Environment variables check:', {
      keyIdExists: !!keyId,
      keySecretExists: !!keySecret,
      keyIdPrefix: keyId?.substring(0, 10)
    })

    if (!keyId || !keySecret) {
      console.log('Missing Razorpay credentials')
      return new Response(
        JSON.stringify({ 
          error: 'Razorpay credentials not configured',
          details: 'Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Razorpay
    console.log('Initializing Razorpay...')
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // Create order
    const orderOptions = {
      amount: amount * 100, // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    }

    console.log('Creating order with options:', JSON.stringify(orderOptions, null, 2))

    const order = await razorpay.orders.create(orderOptions)
    console.log('Order created successfully:', order.id)

    const response = {
      success: true, 
      orderId: order.id,
      order: order 
    }

    console.log('Returning success response')
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== ERROR IN CREATE ORDER FUNCTION ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create order',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Razorpay class for order creation
class Razorpay {
  private keyId: string
  private keySecret: string
  private baseUrl = 'https://api.razorpay.com/v1'

  constructor(config: { key_id: string; key_secret: string }) {
    this.keyId = config.key_id
    this.keySecret = config.key_secret
  }

  get orders() {
    return {
      create: async (options: {
        amount: number
        currency: string
        receipt: string
        notes?: Record<string, any>
      }): Promise<{
        id: string
        entity: string
        amount: number
        amount_paid: number
        amount_due: number
        currency: string
        receipt: string
        status: string
        attempts: number
        notes: Record<string, any>
        created_at: number
      }> => {
        console.log('Making request to Razorpay API...')
        console.log('URL:', `${this.baseUrl}/orders`)
        console.log('Options:', JSON.stringify(options, null, 2))
        
        const response = await fetch(`${this.baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`
          },
          body: JSON.stringify(options)
        })

        console.log('Razorpay API response status:', response.status)
        console.log('Razorpay API response headers:', Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Razorpay API error response:', errorText)
          throw new Error(`Razorpay API error: ${errorText}`)
        }

        const result = await response.json()
        console.log('Razorpay API success response:', JSON.stringify(result, null, 2))
        return result
      }
    }
  }
}
