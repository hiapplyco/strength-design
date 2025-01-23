import { PricingCard } from "./PricingCard";
import { EmailSubscriptionForm } from "./EmailSubscriptionForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

export const TestimonialsSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
      buttonText: "Contact Us"
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
      buttonText: "Contact Us"
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
          isLoading={false}
          onSubscribe={() => setIsDialogOpen(true)}
        />
        <PricingCard
          {...pricingData.pro_plus}
          isHighlighted
          isLoading={false}
          onSubscribe={() => setIsDialogOpen(true)}
        />
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white p-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-oswald text-primary">Stay Updated</h2>
            <p className="text-black">Subscribe to receive updates about our latest features and releases</p>
          </div>
          <EmailSubscriptionForm 
            onSuccessfulSubscribe={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};