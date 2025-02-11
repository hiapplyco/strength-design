
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { LoadingSpinner } from "./LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (subscriptionStatus && 
        !subscriptionStatus.isTrialing && 
        !subscriptionStatus.isSubscribed && 
        subscriptionStatus.status !== 'active') {
      toast({
        title: "Trial Expired",
        description: "Your trial has expired. Please subscribe to continue using the app.",
        variant: "destructive",
      });
    }
  }, [subscriptionStatus, toast]);

  if (authLoading || subscriptionLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Allow access to pricing page regardless of subscription status
  if (location.pathname === "/pricing") {
    return children;
  }

  // If the user has an active subscription, allow access to all routes
  if (subscriptionStatus?.status === 'active' || subscriptionStatus?.isSubscribed) {
    return children;
  }

  // If trial expired and not subscribed, redirect to pricing
  if (subscriptionStatus && 
      !subscriptionStatus.isTrialing && 
      !subscriptionStatus.isSubscribed && 
      subscriptionStatus.status !== 'active') {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return children;
};
