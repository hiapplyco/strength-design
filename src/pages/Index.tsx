
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { width, spacing, text, layout } from "@/utils/responsive";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { UpgradeCTASection } from "@/components/landing/UpgradeCTASection";
import { TestimonialsPlaceholder } from "@/components/landing/TestimonialsPlaceholder";

export default function Index() {
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();

  const handleAuth = () => {
    if (user) {
      navigate("/workout-generator");
    } else {
      setShowAuthDialog(true);
    }
  };

  const header = <LandingHeader user={user} onAuth={handleAuth} />;

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className={`${width.full} ${layout.noOverflow} flex-1 min-h-0 ${spacing.container}`}>
        {/* Features Teaser */}
        <div className={`${spacing.section} text-center`}>
          <h2 className={`text-xl md:text-2xl font-semibold text-primary mb-4`}>
            Everything You Need for Peak Performance
          </h2>
          <p className={`${text.subtitle} text-foreground/80 ${width.content} mx-auto`}>
            Start with 3 free AI-generated workouts, then unlock unlimited access to our complete suite of training tools.
          </p>
        </div>

        <FeaturesGrid />
        <UpgradeCTASection />

        {/* Testimonials Section */}
        <div className={`${spacing.section} text-center`}>
          <h2 className={`text-xl md:text-2xl font-semibold text-primary mb-4`}>
            Hear From Our Users
          </h2>
          <p className={`${text.subtitle} text-foreground/80 ${width.content} mx-auto`}>
            Don't just take our word for it. See how Strength.Design is helping people around the world achieve their fitness goals.
          </p>
        </div>

        <TestimonialsPlaceholder />
      </div>

      <AuthDialog 
        isOpen={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        onSuccess={() => {
          setShowAuthDialog(false);
          navigate("/workout-generator");
        }} 
      />
    </StandardPageLayout>
  );
}
