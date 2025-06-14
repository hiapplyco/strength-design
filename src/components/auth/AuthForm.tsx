
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PasswordValidation } from "./PasswordValidation";
import { useAuthErrorHandler } from "@/hooks/useAuthErrorHandler";

interface AuthFormProps {
  view: "sign_up" | "sign_in";
  onSuccess: () => void;
}

export const AuthForm = ({ view, onSuccess }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const { toast } = useToast();
  const { handleAuthError } = useAuthErrorHandler();

  // SECURITY FIX: Enhanced password validation
  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  };

  // SECURITY FIX: Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // SECURITY FIX: Input validation
      if (!validateEmail(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      if (view === "sign_up") {
        // SECURITY FIX: Validate password strength for sign up
        if (!validatePassword(password)) {
          toast({
            title: "Weak Password",
            description: "Please ensure your password meets all security requirements.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(), // SECURITY FIX: Normalize email
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (error) {
          handleAuthError(error, 'signUp');
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          });
          onSuccess();
        }
      } else {
        // SECURITY FIX: Basic password length check for sign in
        if (password.length < 6) {
          toast({
            title: "Invalid Password",
            description: "Password is too short.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(), // SECURITY FIX: Normalize email
          password,
        });

        if (error) {
          handleAuthError(error, 'signIn');
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been signed in successfully.",
          });
          onSuccess();
        }
      }
    } catch (error) {
      handleAuthError(error, view);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={254}
          className="bg-black/20 border-green-500/30 text-white placeholder:text-white/60"
          placeholder="Enter your email"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setShowPasswordValidation(view === "sign_up")}
          required
          maxLength={128}
          className="bg-black/20 border-green-500/30 text-white placeholder:text-white/60"
          placeholder="Enter your password"
        />
        {view === "sign_up" && (
          <PasswordValidation 
            password={password} 
            showValidation={showPasswordValidation}
          />
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading || (view === "sign_up" && !validatePassword(password)) || !validateEmail(email)}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? "Loading..." : view === "sign_up" ? "Sign Up" : "Sign In"}
      </Button>
    </form>
  );
};
