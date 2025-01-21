import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TestimonialsSection = () => {
  const [loadingStates, setLoadingStates] = useState({
    unlimited: false,
    personalized: false
  });
  const [authSession, setAuthSession] = useState(null);
  const { toast } = useToast();

  // Pre-fetch auth session
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        setAuthSession(session);
      }
    };
    fetchSession();
  }, []);

  const handleSubscription = async (type: 'unlimited' | 'personalized') => {
    try {
      console.log(`Starting ${type} subscription process...`);
      setLoadingStates(prev => ({ ...prev, [type]: true }));
      
      // Use pre-fetched session if available
      const session = authSession || (await supabase.auth.getSession()).data.session;
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating checkout session...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { subscriptionType: type },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      if (data?.url) {
        console.log('Redirecting to Stripe...');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error.message === 'The operation was aborted.' 
          ? "Request timed out. Please try again."
          : error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16">
        Flexible Pricing for Every Fitness Goal
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-muted p-8 rounded-xl">
          <div className="mb-8">
            <h3 className="text-3xl font-oswald text-primary mb-2">Unlimited Access</h3>
            <p className="text-4xl font-bold text-white mb-4">$24.99<span className="text-lg">/month</span></p>
            <ul className="space-y-4">
              {[
                "Unlimited access to our entire library of science-based workout templates",
                "Data-driven insights to guide your training",
                "Basic progress tracking and analytics",
                "Perfect for individual enthusiasts and smaller training operations"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => handleSubscription('unlimited')}
            disabled={loadingStates.unlimited}
          >
            {loadingStates.unlimited ? "Processing..." : "Choose Unlimited"}
          </Button>
        </div>
        <div className="bg-muted p-8 rounded-xl border-2 border-primary">
          <div className="mb-8">
            <h3 className="text-3xl font-oswald text-primary mb-2">Personalized Dashboards</h3>
            <p className="text-4xl font-bold text-white mb-4">$99.99<span className="text-lg">/month</span></p>
            <ul className="space-y-4">
              {[
                "Individualized member dashboards with comprehensive performance metrics",
                "Automated personalized strength programs with dynamic adjustments",
                "Real-time performance tracking and team management capabilities",
                "Advanced analytics and business insights for fitness professionals"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => handleSubscription('personalized')}
            disabled={loadingStates.personalized}
          >
            {loadingStates.personalized ? "Processing..." : "Go Personalized"}
          </Button>
        </div>
      </div>
    </section>
  );
};