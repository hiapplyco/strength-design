import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature ?? '',
        webhookSecret ?? ''
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    console.log(`Event type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0].price.id;
        
        let tier = 'free';
        if (priceId === 'price_1QjidsC3HTLX6YIcMQZNNZjb') {
          tier = 'pro';
        } else if (priceId === 'price_1QjiebC3HTLX6YIcokWaSnIW') {
          tier = 'pro_plus';
        }

        const customer = await stripe.customers.retrieve(session.customer);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();

        if (profiles?.id) {
          await supabase
            .from('profiles')
            .update({ tier })
            .eq('id', profiles.id);
          
          console.log(`Updated user ${profiles.id} to ${tier} tier`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400 }
    );
  }
});