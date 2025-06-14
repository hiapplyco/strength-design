
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { format } from "date-fns";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: subscriptionStatus, isLoading: subscriptionLoading, refetch } = useSubscriptionStatus();
  const { handleSubscription, loadingStates } = useSubscription();
  const { openCustomerPortal, loading: portalLoading } = useCustomerPortal();

  // Refetch subscription status when page loads
  useEffect(() => {
    if (session) {
      refetch();
    }
  }, [session, refetch]);

  const isCurrentlySubscribed = subscriptionStatus?.isSubscribed;
  const subscriptionType = subscriptionStatus?.subscriptionType;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 pt-24 pb-32">
        <div className="text-center mb-16">
          <LogoHeader>upgrade.to.pro</LogoHeader>
          {subscriptionStatus?.subscriptionEnd && (
            <div className="text-xl text-foreground/80 mb-4">
              {isCurrentlySubscribed 
                ? `Subscription renews ${format(new Date(subscriptionStatus.subscriptionEnd), 'PPP')}`
                : `Subscription expired ${format(new Date(subscriptionStatus.subscriptionEnd), 'PPP')}`
              }
            </div>
          )}
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            {isCurrentlySubscribed 
              ? "Manage your subscription or upgrade to access all premium features."
              : "Start with our professional program to unlock unlimited access to our premium features."
            }
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="border rounded-lg p-8 shadow-lg bg-card/20 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Free Access</h2>
            <p className="text-3xl font-bold mb-6 text-foreground">$0<span className="text-sm font-normal">/forever</span></p>
            <ul className="space-y-4 mb-8 text-foreground/80">
              <li>✓ Basic workout generation</li>
              <li>✓ Limited exercise library</li>
              <li>✓ Community support</li>
            </ul>
            <button 
              className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
              disabled={true}
            >
              Current Plan
            </button>
          </div>

          <div className="relative border rounded-lg p-8 shadow-lg bg-primary/5 border-primary backdrop-blur-sm">
            <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
              {isCurrentlySubscribed && subscriptionType === 'personalized' ? 'Current Plan' : 'Most Popular'}
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Pro Program</h2>
            <p className="text-3xl font-bold mb-6 text-foreground">$24.99<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 text-foreground/80">
              <li>✓ Unlimited workout generation</li>
              <li>✓ Full exercise library</li>
              <li>✓ Progress tracking</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
              <li>✓ Video analysis tools</li>
              <li>✓ Document editor</li>
            </ul>
            
            {isCurrentlySubscribed && subscriptionType === 'personalized' ? (
              <Button 
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                onClick={openCustomerPortal}
                disabled={portalLoading}
              >
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </Button>
            ) : (
              <Button 
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                onClick={() => handleSubscription('personalized')}
                disabled={loadingStates.personalized}
              >
                {loadingStates.personalized ? 'Loading...' : 
                 isCurrentlySubscribed ? 'Upgrade Plan' : 'Subscribe Now'}
              </Button>
            )}
          </div>
        </div>

        {isCurrentlySubscribed && (
          <div className="text-center mt-12">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                🎉 You're subscribed!
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                You have full access to all premium features.
              </p>
              <Button 
                variant="outline"
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
              >
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </Button>
            </div>
          </div>
        )}

        {subscriptionLoading && (
          <div className="text-center mt-8">
            <p className="text-foreground/60">Checking subscription status...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
