
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PasswordValidation } from "./PasswordValidation";

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

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === "sign_up") {
        // Validate password strength for sign up
        if (!validatePassword(password)) {
          toast({
            title: "Weak Password",
            description: "Please ensure your password meets all security requirements.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please try signing in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          });
          onSuccess();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Sign in failed",
              description: "Invalid email or password. Please check your credentials and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been signed in successfully.",
          });
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
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
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? "Loading..." : view === "sign_up" ? "Sign Up" : "Sign In"}
      </Button>
    </form>
  );
};
