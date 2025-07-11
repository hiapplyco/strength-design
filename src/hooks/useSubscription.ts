
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSubscription = () => {
  const [loadingStates, setLoadingStates] = useState({
    personalized: false
  });
  const { toast } = useToast();

  const handleSubscription = async (type: 'personalized') => {
    try {
      console.log(`Starting subscription process...`);
      setLoadingStates(prev => ({ ...prev, [type]: true }));

      // Store current location for return after checkout
      localStorage.setItem('checkout-return-url', window.location.pathname);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      // Get the price from our database
      const { data: price, error: priceError } = await supabase
        .from('prices')
        .select('*')
        .eq('id', 'price_1QjidsC3HTLX6YIcMQZNNZjb')
        .single();

      if (priceError || !price) {
        console.error("Could not find subscription price", priceError);
        toast({
          title: "Error: Subscription Not Found",
          description: "No pricing information was found. Please try again later.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      console.log('Creating checkout session...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          subscriptionType: type,
          priceId: price.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('create-checkout function response:', { data, error });

      if (error) {
        console.error('Error from create-checkout:', error);
        toast({
          title: "Checkout Error",
          description: error?.message || "Could not start the checkout process.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      if (!data?.url) {
        console.error('No checkout URL returned from create-checkout', data);
        toast({
          title: "Checkout Error",
          description: "No checkout URL returned. This is likely a configuration issue. Please contact support or try again later.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      if (typeof data.url !== 'string' || !data.url.startsWith("https://checkout.stripe.com")) {
        console.error('Invalid Stripe checkout URL received:', data.url);
        toast({
          title: "Checkout Error",
          description: "Received an invalid checkout URL from Stripe. Please try again later or contact support.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      console.log('Redirecting to Stripe checkout:', data.url);

      // Redirect to Stripe checkout in the same tab
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  return {
    loadingStates,
    handleSubscription
  };
};
