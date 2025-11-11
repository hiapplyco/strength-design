import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";
import { useFirebaseAuth } from "@/providers/FirebaseAuthProvider";
import { isSignInWithEmailLink, signInWithEmailLink, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useFirebaseAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const next = searchParams.get("next") || "/";
      const mode = searchParams.get("mode");
      const oobCode = searchParams.get("oobCode");
      const continueUrl = searchParams.get("continueUrl");
      
      try {
        // Handle email verification link
        if (isSignInWithEmailLink(auth, window.location.href)) {
          const email = window.localStorage.getItem('emailForSignIn');
          if (email) {
            try {
              await signInWithEmailLink(auth, email, window.location.href);
              window.localStorage.removeItem('emailForSignIn');
              toast.success("Email verified successfully!");
              navigate(next, { replace: true });
              return;
            } catch (error) {
              console.error("Email sign-in error:", error);
              toast.error("Failed to verify email. Please try again.");
              navigate("/auth");
              return;
            }
          }
        }

        // Handle password reset
        if (mode === "resetPassword" && oobCode) {
          navigate(`/auth/reset-password?oobCode=${oobCode}`, { replace: true });
          return;
        }

        // Handle email verification
        if (mode === "verifyEmail" && oobCode) {
          // Firebase handles this automatically through the link
          toast.success("Email verified!");
          navigate(next, { replace: true });
          return;
        }

        // If user is already authenticated, redirect
        if (user) {
          navigate(next, { replace: true });
          return;
        }

        // Otherwise, redirect to auth page
        navigate("/auth");
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        navigate("/auth");
      }
    };

    handleCallback();
  }, [navigate, searchParams, user]);

  return <LoadingSpinner />;
}