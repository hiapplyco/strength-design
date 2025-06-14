
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  isTrialing: boolean;
  trialEndsAt: Date | null;
  isSubscribed: boolean;
  subscriptionType: 'unlimited' | 'personalized' | null;
  subscriptionEnd: Date | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | null;
}

export const useSubscriptionStatus = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['subscription-status', session?.user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!session?.user) {
        throw new Error('No user session found');
      }

      try {
        console.log('Checking subscription status...');
        
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error calling check-subscription function:', error);
          // SECURITY FIX: Deny access on error instead of allowing
          return {
            isTrialing: false,
            trialEndsAt: null,
            isSubscribed: false,
            subscriptionType: null,
            subscriptionEnd: null,
            status: null
          };
        }

        console.log('Subscription status response:', data);

        const isSubscribed = data?.subscribed || false;
        const subscriptionType = data?.subscriptionType || null;
        const subscriptionEnd = data?.subscriptionEnd ? new Date(data.subscriptionEnd) : null;

        return {
          isTrialing: false, // We're not using trials currently
          trialEndsAt: null,
          isSubscribed,
          subscriptionType,
          subscriptionEnd,
          status: isSubscribed ? 'active' : null
        };
      } catch (error) {
        console.error('Error checking subscription status:', error);
        
        // SECURITY FIX: Deny access on error - no fallback to allowing access
        return {
          isTrialing: false,
          trialEndsAt: null,
          isSubscribed: false,
          subscriptionType: null,
          subscriptionEnd: null,
          status: null
        };
      }
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5,    // 5 minutes
    gcTime: 1000 * 60 * 10,      // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
