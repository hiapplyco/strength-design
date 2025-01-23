import { useSubscription } from "@/hooks/useSubscription";
import { PricingCard } from "./PricingCard";

export const TestimonialsSection = () => {
  const { loadingStates, handleSubscription } = useSubscription();

  const pricingData = {
    pro: {
      title: "Pro Access",
      price: "$24.99",
      features: [
        "Upload up to 4 photos",
        "Data-driven insights to guide your training",
        "Basic progress tracking and analytics",
        "Perfect for individual enthusiasts and smaller training operations"
      ],
      buttonText: "Choose Pro"
    },
    pro_plus: {
      title: "Pro Plus",
      price: "$99.99",
      features: [
        "Unlimited photo uploads",
        "Individualized member dashboards with comprehensive performance metrics",
        "Automated personalized strength programs with dynamic adjustments",
        "Advanced analytics and business insights for fitness professionals"
      ],
      buttonText: "Go Pro Plus"
    }
  };

  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16">
        Flexible Pricing for Every Goal
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PricingCard
          {...pricingData.pro}
          isLoading={loadingStates.pro}
          onSubscribe={() => handleSubscription('pro')}
        />
        <PricingCard
          {...pricingData.pro_plus}
          isHighlighted
          isLoading={loadingStates.pro_plus}
          onSubscribe={() => handleSubscription('pro_plus')}
        />
      </div>
    </section>
  );
};