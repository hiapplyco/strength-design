
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
        return;
      }

      // Get the price from our database
      const { data: price, error: priceError } = await supabase
        .from('prices')
        .select('*')
        .eq('id', 'price_1QjidsC3HTLX6YIcMQZNNZjb')
        .single();

      if (priceError || !price) {
        throw new Error('Could not find subscription price');
      }

      console.log('Creating checkout session...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          subscriptionType: type,
          priceId: price.id
        }
      });

      if (error) {
        console.error('Error from create-checkout:', error);
        throw error;
      }

      console.log('Received response:', data);

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      console.log('Redirecting to:', data.url);
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
