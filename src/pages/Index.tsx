
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeaderSection } from "@/components/landing/HeaderSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/workout-generator", { replace: true });
    }
  }, [session, navigate]);

  if (session) return null;

  return (
    <div className="relative min-h-screen">
      {/* Background image without overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      />

      {/* Content container */}
      <div className="relative z-10">
        <HeaderSection />
        <HeroSection />
        
        {/* Sections container without gradient transition */}
        <div className="relative mt-[-32px]">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <FeaturesSection />
            <SolutionsSection />
            <TestimonialsSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
