import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSubscription = () => {
  const [loadingStates, setLoadingStates] = useState({
    unlimited: false,
    personalized: false
  });
  const { toast } = useToast();

  const handleSubscription = async (type: 'unlimited' | 'personalized') => {
    try {
      console.log(`Starting ${type} subscription process...`);
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

      console.log('Creating checkout session...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });

      const result = await Promise.race([
        supabase.functions.invoke('create-checkout', {
          body: { subscriptionType: type }
        }),
        timeoutPromise
      ]);

      const { data, error } = result as { data: any; error: any };

      if (error) throw error;

      if (data?.url) {
        console.log('Redirecting to Stripe...');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error.message === 'Request timed out'
          ? "Request timed out. Please try again."
          : error.message || "Failed to create checkout session",
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