import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { ContactForm } from "./ContactForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TestimonialsSection = () => {
  const [isUnlimitedDialogOpen, setIsUnlimitedDialogOpen] = useState(false);
  const [isPersonalizedDialogOpen, setIsPersonalizedDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscription = async (type: 'unlimited' | 'personalized') => {
    try {
      setIsLoading(true);
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { subscriptionType: type }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Choose Unlimited"}
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
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Go Personalized"}
          </Button>
        </div>
      </div>
    </section>
  );
};