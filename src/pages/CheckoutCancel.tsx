
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <LogoHeader>Payment Cancelled</LogoHeader>
        
        <div className="space-y-4 text-foreground/80">
          <p className="text-lg">
            Your payment was cancelled. No charges were made.
          </p>
          <p>
            You can try again anytime or contact us if you need assistance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            onClick={() => navigate('/pricing')}
            className="flex-1"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
