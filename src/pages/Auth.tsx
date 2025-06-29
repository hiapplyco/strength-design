import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Dumbbell, Github, Mail, Phone } from "lucide-react";
import { useAuthState } from "@/components/auth/useAuthState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { view, setView, error } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${from}`,
        },
      });
      
      if (error) {
        toast.error(`Failed to sign in with ${provider}: ${error.message}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = () => {
    toast.info("Phone sign-in coming soon!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {view === "sign_up" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground">
            {view === "sign_up" 
              ? "Start your fitness journey today" 
              : "Sign in to continue your workout"}
          </p>
        </div>

        <Card className="p-6 shadow-lg border-2">
          {error && (
            <div className="mb-4">
              <AuthErrorAlert error={error} />
            </div>
          )}

          {/* Social Sign-In Options */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialSignIn('google')}
              disabled={isLoading}
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialSignIn('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handlePhoneSignIn}
              disabled={isLoading}
            >
              <Phone className="mr-2 h-4 w-4" />
              Continue with Phone
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <AuthForm view={view} onSuccess={handleSuccess} />

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setView(view === "sign_up" ? "sign_in" : "sign_up")}
              className="text-sm"
            >
              {view === "sign_up" 
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <Button variant="link" className="h-auto p-0 text-sm">
            Terms of Service
          </Button>{" "}
          and{" "}
          <Button variant="link" className="h-auto p-0 text-sm">
            Privacy Policy
          </Button>
        </div>
      </div>
    </div>
  );
}