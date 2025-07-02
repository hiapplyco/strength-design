
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_IDS = {
  unlimited: "price_1QjidsC3HTLX6YIcMQZNNZjb",
  personalized: "price_1QjiebC3HTLX6YIcokWaSnIW"
};

const logStep = (step: string, details?: any) => {
  // SECURITY FIX: Sanitize logs - don't log sensitive user data
  const sanitizedDetails = details ? {
    ...details,
    email: details.email ? '***@***.***' : undefined,
    customerId: details.customerId ? 'cus_***' : undefined
  } : undefined;
  
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Create Supabase client using service role for database operations
    const supabaseService = createClient(
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

    const { data: { user }, error: userError } = await supabaseService.auth.getUser(token)
    
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

    // First check local database for manual overrides
    const { data: localSubscription, error: dbError } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!dbError && localSubscription) {
      logStep("Found active subscription in database", { 
        id: localSubscription.id,
        hasManualOverride: localSubscription.metadata?.manual_override 
      });

      // Determine subscription type from price_id
      let subscriptionType = null;
      if (localSubscription.price_id === PRICE_IDS.unlimited) {
        subscriptionType = 'unlimited';
      } else if (localSubscription.price_id === PRICE_IDS.personalized) {
        subscriptionType = 'personalized';
      }

      return new Response(
        JSON.stringify({ 
          subscribed: true,
          subscriptionType,
          subscriptionEnd: localSubscription.current_period_end,
          source: 'database'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

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

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          subscriptionType: null,
          subscriptionEnd: null 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer");

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10
    })

    let subscriptionType = null;
    let subscriptionEnd = null;
    
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // SECURITY FIX: Validate price ID against known values
      if (priceId === PRICE_IDS.unlimited) {
        subscriptionType = 'unlimited';
      } else if (priceId === PRICE_IDS.personalized) {
        subscriptionType = 'personalized';
      } else {
        logStep("WARNING: Unknown price ID detected", { priceId });
      }
      
      logStep("Active subscription found", { subscriptionType });
    } else {
      logStep("No active subscription found");
    }

    const isSubscribed = subscriptionType !== null;

    return new Response(
      JSON.stringify({ 
        subscribed: isSubscribed,
        subscriptionType,
        subscriptionEnd
      }),
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
