import { Button } from "@/components/ui/button";
import { ContactDialog } from "./ContactDialog";
import { VideoSection } from "./VideoSection";
import { GenerateWorkoutButton } from "@/components/GenerateWorkoutButton";
import { Rocket, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  children?: React.ReactNode;
}

export const HeroSection = ({ children }: HeroSectionProps) => {
  return (
    <section className="flex flex-col items-center space-y-8 pt-12 pb-20 w-full" aria-label="Scientific Strength Programming Platform">
      <div className="text-center space-y-4 w-full px-4">
        <h1 className="text-4xl md:text-6xl font-oswald text-primary dark:text-white">
          Evidence-Based Strength Programming
        </h1>
        <p className="text-lg md:text-xl mx-auto text-white max-w-4xl">
          Transform athlete performance with data-driven strength programs built on exercise science.
          Scale from individual training to managing thousands of athletes while maintaining scientific rigor and personalization.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/workout-generator">
              <Button 
                className="bg-destructive text-white hover:bg-destructive/90 font-bold text-lg px-8 py-6 rounded-lg flex items-center gap-2"
              >
                <Rocket className="w-6 h-6" />
                Try Free Generator
              </Button>
            </Link>
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
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/workout-generator">
                  <Button 
                    className="bg-white text-black hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-lg flex items-center gap-2"
                  >
                    <Gift className="w-6 h-6" />
                    Generate Free Workout
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
};