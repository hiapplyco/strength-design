import { PricingCard } from "./PricingCard";
import { ContactForm } from "./ContactForm";

export const TestimonialsSection = () => {
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

  const handleDialogClick = (e: React.MouseEvent) => {
    const dialog = document.getElementById('contact-dialog') as HTMLDialogElement;
    if (dialog && e.target === dialog) {
      dialog.close();
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
          onSubscribe={() => {
            const dialog = document.getElementById('contact-dialog') as HTMLDialogElement;
            if (dialog) {
              dialog.showModal();
            }
          }}
        />
        <PricingCard
          {...pricingData.pro_plus}
          isHighlighted
          isLoading={false}
          onSubscribe={() => {
            const dialog = document.getElementById('contact-dialog') as HTMLDialogElement;
            if (dialog) {
              dialog.showModal();
            }
          }}
        />
      </div>
      
      <dialog 
        id="contact-dialog" 
        className="modal p-6 rounded-lg bg-white shadow-xl max-w-md w-full backdrop:bg-black backdrop:bg-opacity-50"
      >
        <ContactForm 
          subscriptionType="pro" 
          onSuccess={() => {
            const dialog = document.getElementById('contact-dialog') as HTMLDialogElement;
            if (dialog) {
              dialog.close();
            }
          }} 
        />
      </dialog>
    </section>
  );
};