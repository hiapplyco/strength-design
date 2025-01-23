import { EmailSubscriptionForm } from "./EmailSubscriptionForm";

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16">
        Stay Updated
      </h2>
      <EmailSubscriptionForm onSuccessfulSubscribe={() => {}} />
    </section>
  );
};