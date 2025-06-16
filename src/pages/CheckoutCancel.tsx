
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, text, touch, layout } from "@/utils/responsive";

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <StandardPageLayout className={`${layout.center} min-h-screen ${spacing.container}`}>
      <div className={`text-center ${width.narrow}`}>
        <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <LogoHeader>Checkout Cancelled</LogoHeader>
        
        <div className={`${layout.stack} ${spacing.gap} text-foreground/80 mt-4`}>
          <p className={text.subtitle}>
            It looks like you cancelled the checkout process. No worries, no charge was made!
          </p>
          <p className={text.caption}>
            Your next breakthrough is just a click away. When you're ready, we're here.
          </p>
        </div>

        <div className={`flex flex-col sm:flex-row ${spacing.gap} mt-8`}>
          <Button 
            onClick={() => navigate('/pricing')}
            className={`flex-1 ${touch.button}`}
          >
            View Pricing Plans
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className={`flex-1 ${touch.button}`}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default CheckoutCancel;
