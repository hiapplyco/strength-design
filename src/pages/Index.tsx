
import { useNavigate } from "react-router-dom";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { width, spacing, text, layout } from "@/utils/responsive";
import { useAuth } from "@/contexts/AuthContext";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { UpgradeCTASection } from "@/components/landing/UpgradeCTASection";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { WorkoutUploadButton } from "@/components/workout-upload/WorkoutUploadButton";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAuth = () => {
    if (user) {
      navigate("/workout-generator");
    } else {
      navigate("/auth", { state: { from: { pathname: "/workout-generator" } } });
    }
  };

  const header = <LandingHeader user={user} onAuth={handleAuth} />;

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className={`${width.full} ${layout.noOverflow} flex-1 min-h-0 ${spacing.container}`}>
        {/* Workout Upload Section */}
        <div className={`${spacing.section} max-w-3xl mx-auto`}>
          <WorkoutUploadButton />
        </div>

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

        {/* Enhanced Testimonials Section */}
        <div className="relative py-16 px-6 md:px-12 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/10">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2"></div>
          
          <div className="relative z-10 text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Real Stories</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Hear From Our 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60"> Community</span>
            </h2>
            
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Don't just take our word for it. See how Strength.Design is helping people around the world achieve their fitness goals and transform their training.
            </p>
          </div>

          <TestimonialsCarousel />
        </div>
      </div>
    </StandardPageLayout>
  );
}
