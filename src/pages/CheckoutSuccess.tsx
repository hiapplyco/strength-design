
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { refetch } = useSubscriptionStatus();

  useEffect(() => {
    // Refetch subscription status after successful checkout
    const timer = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <LogoHeader>Payment Successful!</LogoHeader>
        
        <div className="space-y-4 text-foreground/80">
          <p className="text-lg">
            Thank you for subscribing to our Pro Program!
          </p>
          <p>
            You now have access to all premium features including unlimited workout generation, 
            video analysis tools, and priority support.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="flex-1"
          >
            View Subscription
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
