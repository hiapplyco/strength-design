
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
    // Only refetch on mount and window focus
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
