import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useCustomerPortal = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Opening customer portal...');

      const customerPortal = httpsCallable(functions, 'customerPortal');
      const result = await customerPortal({});
      const data = result.data as any;

      if (!data?.url) {
        throw new Error('No portal URL received');
      }

      console.log('Redirecting to customer portal:', data.url);
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Portal Error",
        description: error instanceof Error ? error.message : "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    openCustomerPortal,
    loading
  };
};
