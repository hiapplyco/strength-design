import { useEffect } from “react”;
import { useNavigate } from “react-router-dom”;
import { HeaderSection } from “@/components/landing/HeaderSection”;
import { HeroSection } from “@/components/landing/HeroSection”;
import { FeaturesSection } from “@/components/landing/FeaturesSection”;
import { SolutionsSection } from “@/components/landing/SolutionsSection”;
import { TestimonialsSection } from “@/components/landing/TestimonialsSection”;
import { useAuth } from “@/contexts/AuthContext”;

const Index = () => {
const { session } = useAuth();
const navigate = useNavigate();

useEffect(() => {
if (session) {
navigate(”/workout-generator”, { replace: true });
}
}, [session, navigate]);

if (session) return null;

return (

{/* Background image */}
<div
className=“absolute inset-0 bg-cover bg-center bg-fixed”
style={{
backgroundImage:
‘url(”/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png”)’,
}}
/>

  {/* Main gradient overlay */}
  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/40 to-transparent" />

  {/* Page content – ensure it appears above the overlays */}
  <div className="relative z-10">
    <HeaderSection />
    <HeroSection />
  </div>

  {/* Additional sections with an optional bottom overlay */}
  <div className="relative z-10 mt-[-32px]">
    <div className="container mx-auto px-4 max-w-[1200px] relative">
      {/* Bottom gradient overlay to soften the top edge of these sections */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-t from-black/90 to-transparent" />
      <FeaturesSection />
      <SolutionsSection />
      <TestimonialsSection />
    </div>
  </div>
</div>

);
};
