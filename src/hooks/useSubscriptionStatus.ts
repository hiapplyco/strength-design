
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  isTrialing: boolean;
  trialEndsAt: Date | null;
  isSubscribed: boolean;
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

      // Get subscription status from our database
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*, prices(unit_amount, currency, interval)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription from database:', subscriptionError);
        throw subscriptionError;
      }

      // Default to giving access
      const isSubscribed = true;
      const isTrialing = false;
      const validStatus: SubscriptionStatus['status'] = 'active';

      return {
        isTrialing,
        trialEndsAt: null,
        isSubscribed,
        status: validStatus
      };
    },
    enabled: !!session?.user,
    // Use more reasonable caching values
    staleTime: 1000 * 60 * 5,    // 5 minutes
    gcTime: 1000 * 60 * 10,      // 10 minutes (previously cacheTime)
    refetchOnWindowFocus: true,   // Refetch when focus returns to window
    refetchOnMount: true,         // Refetch when component mounts
    refetchOnReconnect: true,     // Refetch when network reconnects
  });
};
