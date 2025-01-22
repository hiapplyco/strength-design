import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";

export const useAuthState = (
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  onSuccess: () => void,
) => {
  const [error, setError] = useState<string>("");
  const [view, setView] = useState<"sign_up" | "sign_in">("sign_up");
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User already signed in, closing dialog");
        onOpenChange(false);
        onSuccess();
      }
    };
    checkSession();
  }, [isOpen, onOpenChange, onSuccess]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('trial_end_date')
          .eq('id', session?.user?.id)
          .single();

        if (profile?.trial_end_date && new Date(profile.trial_end_date) > new Date()) {
          toast({
            title: "Welcome!",
            description: "Your 7-day trial has started. Enjoy creating custom workouts!",
          });
          onSuccess();
          onOpenChange(false);
        } else {
          toast({
            title: "Trial Expired",
            description: "Your trial period has ended. Please subscribe to continue.",
            variant: "destructive",
          });
        }
      }
      
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "Come back soon!",
        });
        setError("");
      }
    });

    return () => subscription.unsubscribe();
  }, [onSuccess, onOpenChange, toast]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'Email not confirmed':
        return 'Please verify your email address before signing in.';
      case 'User not found':
        return 'No user found with these credentials.';
      case 'User already registered':
        setView("sign_in");
        return 'An account with this email already exists. Please sign in instead.';
      default:
        return error.message;
    }
  };

  return {
    error,
    setError,
    view,
    setView,
  };
};