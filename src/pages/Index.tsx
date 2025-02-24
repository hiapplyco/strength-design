
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
      navigate('/workout-generator', { replace: true });
    }
  }, [session, navigate]);

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
          zIndex: 0
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none" />
        <HeaderSection />
        <HeroSection />
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent -mt-32 h-32 pointer-events-none" />
          <div className="container mx-auto px-4 max-w-[1200px] relative">
            <FeaturesSection />
            <SolutionsSection />
            <TestimonialsSection />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
