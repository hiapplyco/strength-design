import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmailSubscriptionForm } from "./EmailSubscriptionForm";
import { useState } from "react";

export const TestimonialsSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccessfulSubscribe = () => {
    setIsDialogOpen(false);
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
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg">Choose Unlimited</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-oswald text-primary mb-4">
                  Let's Level Up Your Training Program
                </AlertDialogTitle>
                <p className="mb-6">
                  Subscribe to discuss how we can enhance your program with our Strength Design expertise.
                </p>
                <EmailSubscriptionForm onSuccessfulSubscribe={handleSuccessfulSubscribe} />
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg">Go Personalized</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-oswald text-primary mb-4">
                  Transform Your Training Experience
                </AlertDialogTitle>
                <p className="mb-6">
                  Subscribe to learn how our personalized dashboard can revolutionize your strength program.
                </p>
                <EmailSubscriptionForm onSuccessfulSubscribe={handleSuccessfulSubscribe} />
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
};