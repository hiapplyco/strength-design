
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, sizes, typography, responsive } from "@/lib/design-tokens";

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
    <StandardPageLayout className={`flex items-center justify-center min-h-screen ${spacing.section.default}`}>
      <div className={`${responsive.text.center} ${sizes.container.sm} mx-auto`}>
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
        </div>

        <div className={`${responsive.flex.mobileColumn} ${spacing.gap.responsive.md} mt-8`}>
          <Button 
            onClick={() => navigate('/dashboard')}
            className={`flex-1 ${sizes.touch.target}`}
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/pricing')}
            className={`flex-1 ${sizes.touch.target}`}
          >
            View Subscription
          </Button>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default CheckoutSuccess;
