import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { PasswordValidation } from "@/components/auth/PasswordValidation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const oobCode = searchParams.get("oobCode");

  // Verify the reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        toast.error("Invalid or missing reset code. Please request a new password reset.");
        navigate("/auth/forgot-password");
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (error: any) {
        console.error("Invalid reset code:", error);
        toast.error("Invalid or expired reset link. Please request a new one.");
        navigate("/auth/forgot-password");
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode, navigate]);

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
    
    if (!validatePassword(password)) {
      toast.error("Please ensure your password meets all security requirements.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!oobCode) {
      toast.error("Reset code is missing. Please request a new password reset.");
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      
      // Redirect to auth page after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-action-code') {
        toast.error("This reset link has expired. Please request a new one.");
        navigate("/auth/forgot-password");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Password is too weak. Please choose a stronger password.");
      } else {
        toast.error(error.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isValidCode) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
          <p className="text-muted-foreground">
            Choose a strong password to secure your account.
          </p>
        </div>

        <Card className="p-6 shadow-lg border-2">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordValidation(true)}
                  required
                  placeholder="Enter new password"
                  className="w-full"
                />
                <PasswordValidation 
                  password={password} 
                  showValidation={showPasswordValidation}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !validatePassword(password) || password !== confirmPassword}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Password updated!</h3>
              <p className="text-muted-foreground">
                Your password has been successfully updated. Redirecting to sign in...
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}