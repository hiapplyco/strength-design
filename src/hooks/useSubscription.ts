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
      
      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth session:", session?.user?.id);
      
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        return;
      }

      console.log("Making request to create-checkout function");
      
      // Make the request to the edge function with the auth token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            subscriptionType: type,
            userId: session.user.id 
          })
        }
      );

      console.log("Response status:", response.status);
      
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create checkout session');
      }
      
      if (!responseData?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe checkout
      window.location.href = responseData.url;
      
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