import { HeaderSection } from "@/components/landing/HeaderSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeaderSection />

      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <FeaturesSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <SolutionsSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <TestimonialsSection />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;