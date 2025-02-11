
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

      console.log('Checking subscription status for user:', session.user.id);

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

      console.log('Database subscription data:', subscription);

      // Check if user has an active subscription via Stripe
      const { data: stripeStatus, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking Stripe subscription:', error);
        throw error;
      }

      console.log('Stripe status response:', stripeStatus);

      const now = new Date();
      const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
      const isTrialing = trialEnd ? trialEnd > now : false;

      // Ensure the status is one of the allowed values
      let validStatus: SubscriptionStatus['status'] = null;
      const statusValue = subscription?.status;
      
      if (statusValue === 'trialing' || 
          statusValue === 'active' || 
          statusValue === 'past_due' || 
          statusValue === 'canceled' || 
          statusValue === 'incomplete') {
        validStatus = statusValue;
      }

      const isSubscribed = stripeStatus?.subscribed || validStatus === 'active';

      const result = {
        isTrialing,
        trialEndsAt: trialEnd,
        isSubscribed,
        status: validStatus
      };

      console.log('Final subscription status:', result);

      return result;
    },
    enabled: !!session?.user,
    refetchInterval: 60000, // Refetch every minute
  });
};
