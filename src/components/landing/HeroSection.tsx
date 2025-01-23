import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { Button } from "@/components/ui/button";
import { EmailSubscriptionForm } from "./EmailSubscriptionForm";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  generatePrompt: string;
  setGeneratePrompt: (prompt: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (show: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (days: number) => void;
  children?: React.ReactNode;
}

export const HeroSection = ({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays,
  children
}: HeroSectionProps) => {
  const [showSubscription, setShowSubscription] = useState(true);

  return (
    <section className="flex flex-col items-center justify-center space-y-8 pt-12 pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl md:text-7xl font-oswald text-primary tracking-tight max-w-4xl dark:text-white">
          Design Smarter Strength Programs From Anywhere
        </h1>
        <p className="text-xl md:text-2xl text-destructive max-w-2xl mx-auto dark:text-red-400">
          Empower your fitness business and members with science-backed, data-driven workouts tailored for every goal
        </p>
      </div>
      
      {showSubscription && (
        <div className="w-full max-w-3xl bg-card/90 backdrop-blur-sm p-8 rounded-xl mt-8 shadow-lg">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-oswald text-primary dark:text-white">Stay Updated</h2>
            <p className="text-black dark:text-gray-200">Subscribe to receive updates about our latest features and releases</p>
          </div>
          <EmailSubscriptionForm onSuccessfulSubscribe={() => setShowSubscription(false)} />
        </div>
      )}

      <div className="w-full relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-30"
             style={{
               backgroundImage: "url('/lovable-uploads/0dee3043-625d-4bc1-860b-e3f952039e56.png')",
               backgroundSize: "cover",
               backgroundPosition: "center",
             }} />
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl mt-8 shadow-lg transform hover:scale-105 transition-transform duration-300 relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-oswald text-white mb-2 uppercase tracking-wider">
              Generate Your Custom Workout Plan
            </h2>
            <p className="text-white text-xl">
              Create up to 12 days of personalized workouts instantly with our advanced computational algorithms
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-white mb-6">
            <div className="bg-black/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
              <h3 className="font-oswald text-xl mb-2">Step 1</h3>
              <p>Input your fitness level and goals for technical development & strength progression</p>
            </div>
            <div className="bg-black/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
              <h3 className="font-oswald text-xl mb-2">Step 2</h3>
              <p>Select your preferred exercises and equipment availability</p>
            </div>
            <div className="bg-black/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
              <h3 className="font-oswald text-xl mb-2">Step 3</h3>
              <p>Get your personalized workout plan with built-in progression</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <ArrowDown className="w-8 h-8 text-primary animate-bounce dark:text-white" />
        <ArrowDown className="w-8 h-8 text-primary animate-bounce delay-100 dark:text-white" />
        <ArrowDown className="w-8 h-8 text-primary animate-bounce delay-200 dark:text-white" />
      </div>

      <div className="w-full max-w-3xl">
        <div className="w-full bg-card/90 backdrop-blur-sm p-8 rounded-lg shadow-lg border-[6px] border-white dark:border-gray-200 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]">
          <h2 className="text-2xl font-oswald text-primary dark:text-white mb-4">Generate Custom Workouts</h2>
          {children}
        </div>
      </div>
    </section>
  );
};