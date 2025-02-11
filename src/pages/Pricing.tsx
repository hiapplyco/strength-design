
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";

const Pricing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const { handleSubscription, loadingStates } = useSubscription();

  return (
    <div className="min-h-screen bg-black">
      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative">
          <div className="container mx-auto px-4 pt-24 pb-32">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
                upgrade.to.pro
              </h1>
              {subscriptionStatus?.isTrialing && subscriptionStatus.trialEndsAt && (
                <div className="text-xl text-white/80 mb-4">
                  Trial expires {format(new Date(subscriptionStatus.trialEndsAt), 'PPP')}
                </div>
              )}
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Start with a free 7-day trial, then unlock unlimited access to our premium features.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="border rounded-lg p-8 shadow-lg bg-white/5 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4 text-white">Free Trial</h2>
                <p className="text-3xl font-bold mb-6 text-white">7 Days<span className="text-sm font-normal">/free</span></p>
                <ul className="space-y-4 mb-8 text-white/80">
                  <li>✓ Full access to all features</li>
                  <li>✓ Test the platform</li>
                  <li>✓ No credit card required</li>
                </ul>
                <button 
                  className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                  disabled={true}
                >
                  {subscriptionStatus?.isTrialing ? 'Currently Active' : 'Trial Expired'}
                </button>
              </div>

              <div className="relative border rounded-lg p-8 shadow-lg bg-primary/5 border-primary backdrop-blur-sm">
                <div className="absolute -top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm">
                  Most Popular
                </div>
                <h2 className="text-2xl font-bold mb-4 text-white">Pro Program</h2>
                <p className="text-3xl font-bold mb-6 text-white">$24.99<span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-4 mb-8 text-white/80">
                  <li>✓ Unlimited workout generation</li>
                  <li>✓ Full exercise library</li>
                  <li>✓ Progress tracking</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Priority support</li>
                </ul>
                <button 
                  className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
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
      </div>
    </div>
  );
};

export default Pricing;
