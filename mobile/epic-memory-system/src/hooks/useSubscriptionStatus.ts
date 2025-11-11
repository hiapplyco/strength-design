
import { useQuery } from "@tanstack/react-query";
import { getFunctions, httpsCallable } from "firebase/functions";
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
  const { user } = useAuth();
  const functions = getFunctions();

  return useQuery({
    queryKey: ['subscription-status', user?.uid],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!user) {
        return {
          isTrialing: false,
          trialEndsAt: null,
          isSubscribed: false,
          subscriptionType: null,
          subscriptionEnd: null,
          status: null
        };
      }

      try {
        console.log('Checking subscription status...');
        console.log('Using Firebase callable function...');
        
        const checkSubscription = httpsCallable(functions, 'checkSubscription');
        const result = await checkSubscription();
        const data = result.data as any;

        console.log('Subscription status response:', data);

        const isSubscribed = data?.subscribed || false;
        const status = data?.status || null;
        const subscriptionType = data?.subscriptionType || null;
        const subscriptionEnd = data?.subscriptionEnd ? new Date(data.subscriptionEnd) : null;

        return {
          isTrialing: status === 'trialing',
          trialEndsAt: null, // We'll need to add this to the Firebase function if needed
          isSubscribed,
          subscriptionType,
          subscriptionEnd,
          status
        };
      } catch (error) {
        console.error('Error checking subscription status:', error);
        
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
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
