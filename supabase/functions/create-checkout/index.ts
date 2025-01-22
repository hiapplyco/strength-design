import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const PRICE_IDS = {
  unlimited: "price_1QjidsC3HTLX6YIcMQZNNZjb",
  personalized: "price_1QjiebC3HTLX6YIcokWaSnIW"
};

serve(async (req) => {
  try {
    console.log("Function invoked with method:", req.method);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    const { subscriptionType } = requestData;
    const priceId = PRICE_IDS[subscriptionType];
    
    if (!priceId) {
      throw new Error('Invalid subscription type');
    }

    console.log("Using price ID:", priceId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    console.log("Verifying token...");
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user?.email) {
      console.error("User verification error:", userError);
      throw new Error('Authentication failed');
    }

    console.log("User verified:", user.id);

    // Check for existing customer
    console.log("Checking for existing customer with email:", user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
      
      // Check for active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        price: priceId,
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        throw new Error('You already have an active subscription to this plan');
      }
    } else {
      console.log("Creating new customer");
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = newCustomer.id;
      console.log("Created new customer:", customerId);
    }

    console.log("Creating checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin') || 'http://localhost:5173'}/`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    console.log("Checkout session created successfully");
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in create-checkout function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});