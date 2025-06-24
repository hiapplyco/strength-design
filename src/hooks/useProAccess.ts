
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAuth } from "@/contexts/AuthContext";

export const useProAccess = () => {
  const { session } = useAuth();
  const { data: subscriptionStatus, isLoading } = useSubscriptionStatus();

  const isProUser = subscriptionStatus?.isSubscribed || false;
  const isAuthenticated = !!session?.user;

  return {
    isProUser,
    isAuthenticated,
    isLoading,
    subscriptionStatus,
  };
};
