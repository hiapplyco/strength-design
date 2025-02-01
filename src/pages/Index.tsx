import { HeaderSection } from "@/components/landing/HeaderSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
          zIndex: 0
        }}
      >
        <HeaderSection />
        <HeroSection />
        <FeaturesSection />
        <SolutionsSection />
        <TestimonialsSection />
      </div>
    </div>
  );
};

export default Index;