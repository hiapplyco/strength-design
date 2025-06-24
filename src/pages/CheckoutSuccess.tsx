
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, sizes, typography, responsive } from "@/lib/design-tokens";
import { useToast } from "@/hooks/use-toast";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch } = useSubscriptionStatus();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const verifySubscription = async () => {
      setIsVerifying(true);
      
      // Clear any existing subscription cache
      localStorage.removeItem('subscription-status');
      
      // Wait a moment for Stripe to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Force refresh subscription status
        await refetch();
        
        // Additional verification attempts
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await refetch();
        }
        
        setVerificationComplete(true);
        
        toast({
          title: "Subscription Activated!",
          description: "Welcome to Pro! You now have access to all premium features.",
        });
        
        // Redirect back to where they came from or workout generator
        const returnUrl = localStorage.getItem('checkout-return-url') || '/workout-generator';
        localStorage.removeItem('checkout-return-url');
        
        setTimeout(() => {
          navigate(returnUrl, { replace: true });
        }, 3000);
        
      } catch (error) {
        console.error('Error verifying subscription:', error);
        toast({
          title: "Subscription Processing",
          description: "Your payment was successful. It may take a few moments for your subscription to activate.",
        });
        
        setTimeout(() => {
          navigate('/workout-generator', { replace: true });
        }, 3000);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [refetch, navigate, toast]);

  return (
    <StandardPageLayout className={`flex items-center justify-center min-h-screen ${spacing.section.default}`}>
      <div className={`${responsive.text.center} ${sizes.container.sm} mx-auto`}>
        {isVerifying ? (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
            <LogoHeader>Activating Your Subscription...</LogoHeader>
            <p className={`${typography.responsive.subtitle} text-foreground/80 mt-4`}>
              Please wait while we activate your Pro features.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <LogoHeader>Payment Successful!</LogoHeader>
            
            <div className={`flex flex-col ${spacing.gap.md} text-foreground/80 mt-4`}>
              <p className={typography.responsive.subtitle}>
                Thank you for subscribing to our Pro Program!
              </p>
              <p className={typography.caption}>
                You now have access to all premium features including unlimited workout generation, 
                video analysis tools, and priority support.
              </p>
              {verificationComplete && (
                <p className="text-green-600 font-medium">
                  ✅ Pro features activated! Redirecting you back...
                </p>
              )}
            </div>

            <div className={`${responsive.flex.mobileColumn} ${spacing.gap.responsive.md} mt-8`}>
              <Button 
                onClick={() => navigate('/workout-generator')}
                className={`flex-1 ${sizes.touch.target}`}
              >
                Continue to Workout Generator
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/pricing')}
                className={`flex-1 ${sizes.touch.target}`}
              >
                View Subscription Details
              </Button>
            </div>
          </>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default CheckoutSuccess;
