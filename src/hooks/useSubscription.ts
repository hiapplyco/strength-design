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
      setLoadingStates(prev => ({ ...prev, [type]: true }));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('create-checkout', {
        body: { subscriptionType: type }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create checkout session');
      }
      
      const { data } = response;
      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      window.location.href = data.url;
      
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start subscription process",
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