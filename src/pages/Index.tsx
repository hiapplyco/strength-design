import { HeaderSection } from "@/components/landing/HeaderSection";
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
    <>
      <HeaderSection />
      <main className="min-h-screen">
        <HeroSection />

        <div 
          className="relative bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
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
      </main>
      <Footer />
    </>
  );
};

export default Index;