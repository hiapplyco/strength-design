import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <section className="relative">
    <div className="container mx-auto px-4 max-w-[1200px]">
      {children}
    </div>
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <div 
        className="relative bg-cover bg-center bg-fixed pt-24"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent" />
        <HeroSection />

        <SectionWrapper>
          <FeaturesSection />
        </SectionWrapper>

        <SectionWrapper>
          <SolutionsSection />
        </SectionWrapper>

        <SectionWrapper>
          <TestimonialsSection />
        </SectionWrapper>
      </div>
    </div>
  );
};

export default Index;