
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
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();  // Changed from .single() to .maybeSingle()

      if (subscriptionError) {
        throw subscriptionError;
      }

      if (!subscription) {
        return {
          isTrialing: false,
          trialEndsAt: null,
          isSubscribed: false,
          status: null
        };
      }

      const now = new Date();
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
      const isTrialing = trialEnd ? trialEnd > now : false;

      // Check if user has an active subscription via Stripe
      const { data: stripeStatus, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw error;
      }

      return {
        isTrialing,
        trialEndsAt: trialEnd,
        isSubscribed: stripeStatus?.subscribed || false,
        status: subscription.status
      };
    },
    enabled: !!session?.user,
    refetchInterval: 60000, // Refetch every minute
  });
};
