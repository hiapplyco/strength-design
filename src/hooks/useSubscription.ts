
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
        // Pass the access token for authentication
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Log all result information for debug
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
        // Could be error in edge function or Stripe set up
        console.error('No checkout URL returned from create-checkout', data);
        toast({
          title: "Checkout Error",
          description:
            "No checkout URL returned. This is likely a configuration issue. Please contact support or try again later.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      console.log('Redirecting to Stripe checkout:', data.url);

      // Open in new tab for Stripe (recommended) or redirect current tab
      window.location.href = data.url;
      // Alternative: window.open(data.url, '_blank');

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
