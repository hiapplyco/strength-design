import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PasswordValidation } from "./PasswordValidation";
import { useAuthErrorHandler } from "@/hooks/useAuthErrorHandler";
import { useFirebaseAuth } from "@/providers/FirebaseAuthProvider";
import { sendEmailVerification } from "firebase/auth";

interface AuthFormProps {
  view: "sign_up" | "sign_in" | "forgot_password";
  onSubmit?: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  onSuccess?: () => void;
}

export const AuthForm = ({ view, onSubmit, loading: externalLoading, onSuccess }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const { toast } = useToast();
  const { handleAuthError } = useAuthErrorHandler();
  const { signIn, signUp, resetPassword } = useFirebaseAuth();

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!validateEmail(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      // If custom onSubmit is provided (for forgot password)
      if (onSubmit) {
        await onSubmit(email, password);
        return;
      }

      if (view === "sign_up") {
        if (!validatePassword(password)) {
          toast({
            title: "Weak Password",
            description: "Please ensure your password meets all security requirements.",
            variant: "destructive",
          });
          return;
        }

        const { user, error } = await signUp(email.trim().toLowerCase(), password);

        if (error) {
          handleAuthError(error, 'signUp');
        } else if (user) {
          // Send verification email
          try {
            await sendEmailVerification(user);
            toast({
              title: "Check your email",
              description: "We've sent you a confirmation link to complete your registration.",
            });
          } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            toast({
              title: "Account created",
              description: "Your account was created successfully, but we couldn't send a verification email.",
            });
          }
          onSuccess?.();
        }
      } else if (view === "sign_in") {
        if (password.length < 6) {
          toast({
            title: "Invalid Password",
            description: "Password is too short.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signIn(email.trim().toLowerCase(), password);

        if (error) {
          handleAuthError(error, 'signIn');
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been signed in successfully.",
          });
          onSuccess?.();
        }
      } else if (view === "forgot_password") {
        const { error } = await resetPassword(email.trim().toLowerCase());
        
        if (!error) {
          toast({
            title: "Password reset email sent",
            description: "Check your email for instructions to reset your password.",
          });
        }
      }
    } catch (error) {
      handleAuthError(error, view);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || externalLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={254}
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>
      
      {view !== "forgot_password" && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowPasswordValidation(view === "sign_up")}
            required
            maxLength={128}
            placeholder="Enter your password"
            disabled={loading}
          />
          {view === "sign_up" && (
            <PasswordValidation 
              password={password} 
              showValidation={showPasswordValidation}
            />
          )}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={loading || (view === "sign_up" && !validatePassword(password)) || !validateEmail(email)}
        className="w-full"
      >
        {loading ? "Loading..." : 
         view === "sign_up" ? "Sign Up" : 
         view === "sign_in" ? "Sign In" : 
         "Send Reset Email"}
      </Button>

      {view === "sign_in" && (
        <div className="text-center mt-4">
          <Link 
            to="/auth/forgot-password" 
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      )}
    </form>
  );
};