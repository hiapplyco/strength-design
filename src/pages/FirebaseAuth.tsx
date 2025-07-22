import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/providers/FirebaseAuthProvider";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Dumbbell, Mail, Phone } from "lucide-react";
import { PhoneAuthModal } from "@/components/auth/PhoneAuthModal";
import { toast } from "sonner";
import { trackAuth } from "@/lib/analytics";

export default function FirebaseAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    signInWithPhone,
    verifyPhoneCode,
    setupPhoneRecaptcha,
    resetPassword 
  } = useFirebaseAuth();
  
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgot_password'>('sign_in');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || "/";

  const handleSuccess = () => {
    trackAuth(view === 'sign_in' ? 'login' : 'signup');
    navigate(from, { replace: true });
  };

  const handleEmailAuth = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (view === 'sign_in') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          toast.success("Welcome back!");
          handleSuccess();
        }
      } else if (view === 'sign_up') {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          toast.success("Account created successfully!");
          handleSuccess();
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
        toast.error("Failed to sign in with Google");
      } else {
        toast.success("Welcome!");
        handleSuccess();
      }
    } catch (err) {
      setError("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = () => {
    setPhoneModalOpen(true);
  };

  const handlePhoneAuth = async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Setup recaptcha
      await setupPhoneRecaptcha('recaptcha-container');
      
      const { error } = await signInWithPhone(phoneNumber);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("Failed to send verification code");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await verifyPhoneCode(code);
      if (error) {
        setError(error.message);
        return false;
      }
      toast.success("Phone verified successfully!");
      handleSuccess();
      return true;
    } catch (err) {
      setError("Invalid verification code");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await resetPassword(email);
      if (!error) {
        setView('sign_in');
      }
    } catch (err) {
      setError("Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Strength.Design</h1>
          </div>
          <p className="text-muted-foreground">
            {view === 'sign_in' && "Welcome back! Sign in to continue"}
            {view === 'sign_up' && "Create your account to get started"}
            {view === 'forgot_password' && "Reset your password"}
          </p>
        </div>

        <Card className="p-6">
          {error && <AuthErrorAlert error={error} />}
          
          {view !== 'forgot_password' && (
            <>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
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
            </>
          )}

          <AuthForm
            view={view}
            onSubmit={view === 'forgot_password' ? handlePasswordReset : handleEmailAuth}
            loading={isLoading}
          />

          <div className="mt-4 text-center text-sm">
            {view === 'sign_in' && (
              <>
                <span className="text-muted-foreground">Don't have an account? </span>
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => setView('sign_up')}
                >
                  Sign up
                </Button>
              </>
            )}
            {view === 'sign_up' && (
              <>
                <span className="text-muted-foreground">Already have an account? </span>
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => setView('sign_in')}
                >
                  Sign in
                </Button>
              </>
            )}
            {view !== 'forgot_password' && (
              <div className="mt-2">
                <Button
                  variant="link"
                  className="p-0 text-xs"
                  onClick={() => setView('forgot_password')}
                >
                  Forgot your password?
                </Button>
              </div>
            )}
            {view === 'forgot_password' && (
              <Button
                variant="link"
                className="p-0"
                onClick={() => setView('sign_in')}
              >
                Back to sign in
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <PhoneAuthModal
        open={phoneModalOpen}
        onOpenChange={setPhoneModalOpen}
        onSendCode={handlePhoneAuth}
        onVerifyCode={handleVerifyCode}
        isLoading={isLoading}
        error={error || undefined}
      />
      
      {/* Recaptcha container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}