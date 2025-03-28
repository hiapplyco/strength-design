
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { LogoHeader } from "@/components/ui/logo-header";

const Pricing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const { handleSubscription, loadingStates } = useSubscription();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 pt-24 pb-32">
        <div className="text-center mb-16">
          <LogoHeader>upgrade.to.pro</LogoHeader>
          {subscriptionStatus?.isTrialing && subscriptionStatus.trialEndsAt && (
            <div className="text-xl text-foreground/80 mb-4">
              Trial expires {format(new Date(subscriptionStatus.trialEndsAt), 'PPP')}
            </div>
          )}
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Start with a free 7-day trial, then unlock unlimited access to our premium features.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="border rounded-lg p-8 shadow-lg bg-card/20 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Free Trial</h2>
            <p className="text-3xl font-bold mb-6 text-foreground">7 Days<span className="text-sm font-normal">/free</span></p>
            <ul className="space-y-4 mb-8 text-foreground/80">
              <li>✓ Full access to all features</li>
              <li>✓ Test the platform</li>
              <li>✓ No credit card required</li>
            </ul>
            <button 
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              disabled={true}
            >
              {subscriptionStatus?.isTrialing ? 'Currently Active' : 'Trial Expired'}
            </button>
          </div>

          <div className="relative border rounded-lg p-8 shadow-lg bg-primary/5 border-primary backdrop-blur-sm">
            <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Pro Program</h2>
            <p className="text-3xl font-bold mb-6 text-foreground">$24.99<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 text-foreground/80">
              <li>✓ Unlimited workout generation</li>
              <li>✓ Full exercise library</li>
              <li>✓ Progress tracking</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
            <button 
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              onClick={() => handleSubscription('personalized')}
              disabled={loadingStates.personalized || subscriptionStatus?.status === 'active'}
            >
              {loadingStates.personalized ? 'Loading...' : 
               subscriptionStatus?.status === 'active' ? 'Current Plan' : 'Subscribe Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
