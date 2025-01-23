import { ContactDialog } from "./ContactDialog";

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16">
        Join Our Community
      </h2>
      <p className="text-center text-gray-800 dark:text-white text-lg mb-8 max-w-2xl mx-auto">
        Join thousands of fitness professionals using our platform to create personalized workout programs.
      </p>
      <div className="flex justify-center">
        <ContactDialog buttonText="Start Your Journey" variant="outline" />
      </div>
    </section>
  );
};