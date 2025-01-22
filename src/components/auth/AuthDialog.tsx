import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isNewUser?: boolean;
}

export const AuthDialog = ({ isOpen, onOpenChange, onSuccess, isNewUser = true }: AuthDialogProps) => {
  const [error, setError] = useState<string>("");
  const [view, setView] = useState<"sign_up" | "sign_in">(isNewUser ? "sign_up" : "sign_in");
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('trial_end_date')
          .eq('id', session?.user?.id)
          .single();

        if (profile && new Date(profile.trial_end_date) > new Date()) {
          toast({
            title: "Welcome!",
            description: "Your 7-day trial has started. Enjoy creating custom workouts!",
          });
          onSuccess();
        } else {
          toast({
            title: "Trial Expired",
            description: "Your trial period has ended. Please subscribe to continue.",
            variant: "destructive",
          });
        }
      }
      if (event === 'USER_UPDATED') {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setError(getErrorMessage(error));
        }
      }
      if (event === 'SIGNED_OUT') {
        setError(""); // Clear errors on sign out
      }
    });

    return () => subscription.unsubscribe();
  }, [onSuccess, toast]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'Email not confirmed':
        return 'Please verify your email address before signing in.';
      case 'User not found':
        return 'No user found with these credentials.';
      case 'User already registered':
        setView("sign_in"); // Switch to sign in view
        return 'An account with this email already exists. Please sign in instead.';
      default:
        return error.message;
    }
  };

  const handleViewChange = (newView: "sign_up" | "sign_in") => {
    setView(newView);
    setError(""); // Clear any existing errors when switching views
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-oswald">
            {view === "sign_up" ? "Start Your 7-Day Free Trial" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#D4B96D',
                  brandAccent: '#b39b5c',
                }
              }
            }
          }}
          providers={[]}
          view={view}
          localization={{
            variables: {
              sign_up: {
                email_label: "Email",
                password_label: "Create Password",
                button_label: "Start Free Trial",
                link_text: "Already have an account? Sign in",
              },
              sign_in: {
                email_label: "Email",
                password_label: "Password",
                button_label: "Sign In",
                link_text: "New here? Start your free trial",
              },
            },
          }}
          onChange={view => handleViewChange(view as "sign_up" | "sign_in")}
        />
      </DialogContent>
    </Dialog>
  );
};