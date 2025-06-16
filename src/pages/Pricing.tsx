
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingCards } from "@/components/pricing/PricingCards";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, text, layout } from "@/utils/responsive";

export default function Pricing() {
  const { session } = useAuth();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const { loadingStates, handleSubscription } = useSubscription();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSubscribed(subscriptionStatus?.isSubscribed || false);
  }, [subscriptionStatus]);

  const header = (
    <div className={`${spacing.section} text-center ${spacing.container}`}>
      <h1 className={`${text.title} font-bold text-primary`}>Upgrade to Pro</h1>
      <p className={`${text.subtitle} text-foreground/80 ${width.content} mt-2`}>
        Unlock unlimited workout generation and advanced tools.
      </p>
    </div>
  );

  return (
    <StandardPageLayout header={header} className={spacing.container}>
      <div className={`${width.full} ${layout.center} flex-1 min-h-0`}>
        {isSubscribed ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-green-500 mb-4">
              You are already a Pro member!
            </h2>
            <p className="text-foreground/80">
              Enjoy unlimited access to all features.
            </p>
          </div>
        ) : (
          <div className={`${width.full} ${layout.noOverflow}`}>
            <PricingCards 
              onSubscribeClick={handleSubscription}
              isSubscribing={loadingStates.personalized}
            />
          </div>
        )}

        {!session && (
          <p className={`text-center mt-6 text-foreground/80 ${spacing.container}`}>
            <Link to="/sign-in" className="text-primary hover:underline">Sign in</Link> to view subscription options.
          </p>
        )}
      </div>
    </StandardPageLayout>
  );
}
