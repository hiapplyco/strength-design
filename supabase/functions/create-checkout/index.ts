
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_IDS = {
  unlimited: "price_1QjiebC3HTLX6YIcokWaSnIW", // Customized "Program for your Programming"
  personalized: "price_1QjidsC3HTLX6YIcMQZNNZjb" // Standard Package
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { subscriptionType } = await req.json()
    const priceId = PRICE_IDS[subscriptionType]
    
    if (!priceId) {
      throw new Error('Invalid subscription type')
    }

    console.log(`Using price ID: ${priceId} for subscription type: ${subscriptionType}`);

    // Get user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user?.email) {
      throw new Error('Authentication failed')
    }

    // Find or create customer
    let customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
    }

    // Create checkout session with exact same configuration as working example
    console.log('Creating checkout session...')
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
    })

    if (!session.url) {
      throw new Error('Failed to create checkout session URL')
    }

    console.log('Checkout session created:', session.id)
    console.log('Checkout URL:', session.url)
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
