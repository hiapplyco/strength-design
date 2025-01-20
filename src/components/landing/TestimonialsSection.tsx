import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TestimonialsSection = () => {
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
          <Button className="w-full" size="lg">Choose Unlimited</Button>
        </div>
        <div className="bg-muted p-8 rounded-xl border-2 border-primary">
          <div className="mb-8">
            <h3 className="text-3xl font-oswald text-primary mb-2">Personalized Dashboards</h3>
            <p className="text-4xl font-bold text-white mb-4">$99.99<span className="text-lg">/month</span></p>
            <ul className="space-y-4">
              {[
                "Individualized gym-member dashboards inspired by Orangetheory-style metrics",
                "Personalized strength programs for each member updated automatically",
                "Real-time performance tracking with the ability to scale to all your members or teams",
                "Advanced analytics for coaches, trainers, and gym owners",
                "Ideal for gyms, studios, and large coaching businesses"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button className="w-full" size="lg">Go Personalized</Button>
        </div>
      </div>
    </section>
  );
};