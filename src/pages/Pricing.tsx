
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";
import { format } from "date-fns";
import { LogoHeader } from "@/components/ui/logo-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown, Check } from "lucide-react";

const Pricing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: subscriptionStatus, isLoading: subscriptionLoading, refetch } = useSubscriptionStatus();
  const { handleSubscription, loadingStates } = useSubscription();
  const { openCustomerPortal, loading: portalLoading } = useCustomerPortal();
  const { workoutUsage } = useWorkoutUsage();

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
              : "Get 3 free workouts, then upgrade to Pro for unlimited access to premium features."
            }
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="border rounded-lg p-8 shadow-lg bg-card/20 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Free Access</h2>
            <p className="text-3xl font-bold mb-6 text-foreground">$0<span className="text-sm font-normal">/forever</span></p>
            
            {/* Workout Usage Display for Free Users */}
            {!isCurrentlySubscribed && workoutUsage && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Your Progress</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {workoutUsage.free_workouts_used} of 3 workouts used
                  </span>
                  <Badge variant={workoutUsage.free_workouts_remaining > 0 ? "default" : "destructive"}>
                    {workoutUsage.free_workouts_remaining} remaining
                  </Badge>
                </div>
              </div>
            )}

            <ul className="space-y-4 mb-8 text-foreground/80">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>3 free workout generations</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Basic exercise library</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Community support</span>
              </li>
              <li className="text-gray-500">✗ Advanced customization</li>
              <li className="text-gray-500">✗ Progress tracking</li>
              <li className="text-gray-500">✗ Priority support</li>
            </ul>
            
            <button 
              className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
              disabled={true}
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative border rounded-lg p-8 shadow-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800 backdrop-blur-sm">
            <div className="absolute -top-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {isCurrentlySubscribed && subscriptionType === 'personalized' ? 'Current Plan' : 'Most Popular'}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-foreground">Pro Program</h2>
            </div>
            <p className="text-3xl font-bold mb-6 text-foreground">$25<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 text-foreground/80">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">Unlimited workout generation</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Full exercise library</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Progress tracking & analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Advanced customization</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Video analysis tools</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Document editor access</span>
              </li>
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
                className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium disabled:opacity-50"
                onClick={() => handleSubscription('personalized')}
                disabled={loadingStates.personalized}
              >
                {loadingStates.personalized ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    {isCurrentlySubscribed ? 'Upgrade Plan' : 'Upgrade to Pro'}
                  </>
                )}
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
                You have unlimited access to all premium features.
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
