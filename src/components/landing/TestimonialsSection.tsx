import { useSubscription } from "@/hooks/useSubscription";
import { PricingCard } from "./PricingCard";

export const TestimonialsSection = () => {
  const { loadingStates, handleSubscription } = useSubscription();

  const pricingData = {
    unlimited: {
      title: "Unlimited Access",
      price: "$24.99",
      features: [
        "Unlimited access to our entire library of science-based workout templates",
        "Data-driven insights to guide your training",
        "Basic progress tracking and analytics",
        "Perfect for individual enthusiasts and smaller training operations"
      ],
      buttonText: "Choose Unlimited"
    },
    personalized: {
      title: "Personalized Dashboards",
      price: "$99.99",
      features: [
        "Individualized member dashboards with comprehensive performance metrics",
        "Automated personalized strength programs with dynamic adjustments",
        "Real-time performance tracking and team management capabilities",
        "Advanced analytics and business insights for fitness professionals"
      ],
      buttonText: "Go Personalized"
    }
  };

  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16">
        Flexible Pricing for Every Fitness Goal
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PricingCard
          {...pricingData.unlimited}
          isLoading={loadingStates.unlimited}
          onSubscribe={() => handleSubscription('unlimited')}
        />
        <PricingCard
          {...pricingData.personalized}
          isHighlighted
          isLoading={loadingStates.personalized}
          onSubscribe={() => handleSubscription('personalized')}
        />
      </div>
    </section>
  );
};