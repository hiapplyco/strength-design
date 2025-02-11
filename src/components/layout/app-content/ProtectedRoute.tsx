
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

  // Debug log to help track subscription status
  console.log('Current subscription status:', subscriptionStatus);

  useEffect(() => {
    if (subscriptionStatus && 
        !subscriptionStatus.isTrialing && 
        !subscriptionStatus.isSubscribed &&
        location.pathname !== '/pricing') {
      toast({
        title: "Trial Expired",
        description: "Your trial has expired. Please subscribe to continue using the app.",
        variant: "destructive",
      });
    }
  }, [subscriptionStatus, toast, location.pathname]);

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

  // Check subscription status
  const hasAccess = subscriptionStatus?.isSubscribed || subscriptionStatus?.isTrialing;
  
  if (hasAccess) {
    return children;
  }

  // If no access (no trial and not subscribed), redirect to pricing
  return <Navigate to="/pricing" state={{ from: location }} replace />;
};
