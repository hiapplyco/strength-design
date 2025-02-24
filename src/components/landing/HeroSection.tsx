import { Button } from "@/components/ui/button";
import { ContactDialog } from "./ContactDialog";
import { VideoSection } from "./VideoSection";
import { Rocket, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  children?: React.ReactNode;
}

export const HeroSection = ({ children }: HeroSectionProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/workout-generator');
  };

  return (
    <section 
      className="relative flex flex-col items-center space-y-8 pt-48 pb-24 w-full"
      aria-label="Scientific Strength Programming Platform"
    >
      <div className="relative z-10 text-center space-y-4 w-full px-4">
        <h1 className="text-4xl md:text-6xl font-oswald text-primary dark:text-white">
          Evidence-Based Strength Programming
        </h1>
        <p className="text-lg md:text-xl mx-auto text-white max-w-4xl">
          Transform athlete performance with data-driven strength programs built on exercise science.
          Scale from individual training to managing thousands of athletes while maintaining scientific rigor and personalization.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => setShowAuthDialog(true)}
              className="bg-destructive text-white hover:bg-destructive/90 font-bold text-lg px-8 py-6 rounded-lg flex items-center gap-2"
            >
              <Rocket className="w-6 h-6" />
              Sign Up / Log In
            </Button>
          </motion.div>
          <ContactDialog buttonText="Schedule a Demo" variant="outline" />
        </div>

        <VideoSection />

        <div className="mt-12 max-w-2xl mx-auto px-4">
          <div className="bg-black/90 border-2 border-destructive rounded-xl p-8 backdrop-blur-sm transform hover:scale-[1.02] transition-all">
            <div className="inline-block bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold mb-4">
              Limited Time Offer
            </div>
            <h3 className="text-2xl md:text-3xl font-oswald text-white mb-4">
              Try Our Evidence-Based Programming Free
            </h3>
            <p className="text-white mb-6">
              Experience enterprise-grade programming technology. Generate custom workouts powered by exercise science - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setShowAuthDialog(true)}
                  className="bg-white text-black hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-lg flex items-center gap-2"
                >
                  <Gift className="w-6 h-6" />
                  Sign Up Now
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {children}

      <AuthDialog 
        isOpen={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
};
