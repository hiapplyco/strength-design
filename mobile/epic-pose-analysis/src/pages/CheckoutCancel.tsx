
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, sizes, typography, responsive } from "@/lib/design-tokens";

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <StandardPageLayout className={`flex items-center justify-center min-h-screen ${spacing.section.default}`}>
      <div className={`${responsive.text.center} ${sizes.container.sm} mx-auto`}>
        <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <LogoHeader>Checkout Cancelled</LogoHeader>
        
        <div className={`flex flex-col ${spacing.gap.md} text-foreground/80 mt-4`}>
          <p className={typography.responsive.subtitle}>
            It looks like you cancelled the checkout process. No worries, no charge was made!
          </p>
          <p className={typography.caption}>
            Your next breakthrough is just a click away. When you're ready, we're here.
          </p>
        </div>

        <div className={`${responsive.flex.mobileColumn} ${spacing.gap.responsive.md} mt-8`}>
          <Button 
            onClick={() => navigate('/pricing')}
            className={`flex-1 ${sizes.touch.target}`}
          >
            View Pricing Plans
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className={`flex-1 ${sizes.touch.target}`}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default CheckoutCancel;
