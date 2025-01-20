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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { triggerConfetti } from "@/utils/confetti";

export const TestimonialsSection = () => {
  const [isUnlimitedDialogOpen, setIsUnlimitedDialogOpen] = useState(false);
  const [isPersonalizedDialogOpen, setIsPersonalizedDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (subscriptionType: string) => {
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert([{ name, email, subscription_type: subscriptionType }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Thank you for your interest. We'll reach out to you shortly.",
      });
      triggerConfetti();
      
      // Reset form and close dialog
      setName("");
      setEmail("");
      if (subscriptionType === "Unlimited") {
        setIsUnlimitedDialogOpen(false);
      } else {
        setIsPersonalizedDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ContactForm = ({ subscriptionType }: { subscriptionType: string }) => (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-white text-black"
      />
      <Input
        type="email"
        placeholder="Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-white text-black"
      />
      <Button 
        className="w-full" 
        onClick={() => handleSubmit(subscriptionType)}
      >
        Submit
      </Button>
      <p className="text-sm text-center text-gray-600">
        We'll reach out to you shortly to discuss how we can help achieve your fitness goals.
      </p>
    </div>
  );

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
          <AlertDialog open={isUnlimitedDialogOpen} onOpenChange={setIsUnlimitedDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg">Choose Unlimited</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-oswald text-primary mb-4">
                  Let's Level Up Your Training Program
                </AlertDialogTitle>
                <ContactForm subscriptionType="Unlimited" />
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
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
          <AlertDialog open={isPersonalizedDialogOpen} onOpenChange={setIsPersonalizedDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg">Go Personalized</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-oswald text-primary mb-4">
                  Transform Your Training Experience
                </AlertDialogTitle>
                <ContactForm subscriptionType="Personalized" />
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
};