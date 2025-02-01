import { ContactDialog } from "./ContactDialog";

export const TestimonialsSection = () => {
  return (
    <section className="relative py-20 px-6 md:px-12 rounded-3xl overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/documents//image_fx_%20(2).jpg")',
        }}
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16">
          Join Our Community
        </h2>
        <p className="text-center text-white text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of fitness professionals using our platform to create personalized workout programs.
        </p>
        <div className="flex justify-center">
          <ContactDialog buttonText="Start Your Journey" variant="outline" />
        </div>
      </div>
    </section>
  );
};