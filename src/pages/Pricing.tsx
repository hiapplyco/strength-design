
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingCards } from "@/components/pricing/PricingCards";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

export default function Pricing() {
  const { session } = useAuth();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const { loadingStates, handleSubscription } = useSubscription();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSubscribed(subscriptionStatus?.isSubscribed || false);
  }, [subscriptionStatus]);

  const handleSubscribe = async () => {
    await handleSubscription('personalized');
  };

  return (
    <StandardPageLayout
      header={
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Upgrade to Pro</h1>
          <p className="text-lg text-foreground/80 max-w-3xl mx-auto mt-2">
            Unlock unlimited workout generation and advanced tools.
          </p>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center flex-1 min-h-0">
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
          <PricingCards 
            onSubscribeClick={handleSubscribe}
            isSubscribing={loadingStates.personalized}
          />
        )}

        {!session && (
          <p className="text-center mt-6 text-foreground/80">
            <Link to="/sign-in" className="text-primary hover:underline">Sign in</Link> to view subscription options.
          </p>
        )}
      </div>
    </StandardPageLayout>
  );
}
