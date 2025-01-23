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
  const [view, setView] = useState<"sign_up" | "sign_in">("sign_in");
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User already signed in, closing dialog");
        await supabase.auth.signOut(); // Sign out if there's an existing session
        onOpenChange(false);
      }
    };
    checkSession();
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "Come back soon!",
        });
        setError("");
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

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