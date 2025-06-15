
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <LogoHeader>Checkout Cancelled</LogoHeader>
        
        <div className="space-y-4 text-foreground/80">
          <p className="text-lg">
            It looks like you cancelled the checkout process. No worries, no charge was made!
          </p>
          <p>
            Your next breakthrough is just a click away. When you're ready, we're here.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            onClick={() => navigate('/pricing')}
            className="flex-1"
          >
            View Pricing Plans
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
