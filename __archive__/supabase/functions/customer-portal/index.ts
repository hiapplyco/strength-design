
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  // SECURITY FIX: Sanitize logs - don't log sensitive data
  const sanitizedDetails = details ? {
    ...details,
    email: details.email ? '***@***.***' : undefined,
    customerId: details.customerId ? 'cus_***' : undefined
  } : undefined;
  
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Function started");

    // SECURITY FIX: Validate environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      logStep("ERROR: Missing Stripe secret key");
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // SECURITY FIX: Validate auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logStep("ERROR: Invalid authorization header");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const token = authHeader.replace('Bearer ', '')
    
    // SECURITY FIX: Validate token format
    if (!token || token.length < 10) {
      logStep("ERROR: Invalid token format");
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user?.email) {
      logStep("ERROR: Authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    logStep("User authenticated", { userId: user.id });

    // SECURITY FIX: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      logStep("ERROR: Invalid email format");
      return new Response(
        JSON.stringify({ error: 'Invalid user data' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // Find customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      logStep("ERROR: No Stripe customer found");
      return new Response(
        JSON.stringify({ error: 'No subscription found for this account' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer");

    // SECURITY FIX: Validate origin header
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'https://strength-design.lovableproject.com',
      // Add your production domain here
    ];
    
    const returnUrl = allowedOrigins.includes(origin || '') ? `${origin}/pricing` : 'https://strength-design.lovableproject.com/pricing';
    
    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    logStep("Customer portal session created");

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: 'Unexpected error occurred' });
    
    // SECURITY FIX: Don't expose internal error details
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
