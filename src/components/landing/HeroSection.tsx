import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { Button } from "@/components/ui/button";
import { EmailSubscriptionForm } from "./EmailSubscriptionForm";
import { useState } from "react";
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
        <h1 className="text-6xl md:text-7xl font-oswald text-primary tracking-tight max-w-4xl">
          Design Smarter Strength Programs From Anywhere
        </h1>
        <p className="text-xl md:text-2xl text-destructive max-w-2xl mx-auto">
          Empower your fitness business and members with science-backed, data-driven workouts tailored for every goal
        </p>
      </div>
      
      {showSubscription && (
        <div className="w-full max-w-3xl transform hover:scale-[0.99] transition-transform duration-200 border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] bg-white/90 backdrop-blur-sm p-8 rounded-xl mt-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-oswald text-primary">Stay Updated</h2>
            <p className="text-black">Subscribe to receive updates about our latest features and releases</p>
          </div>
          <EmailSubscriptionForm onSuccessfulSubscribe={() => setShowSubscription(false)} />
        </div>
      )}

      <div className="w-full relative">
        <div className="relative z-10 max-w-7xl mx-auto transform hover:scale-[0.99] transition-transform duration-200 border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] bg-white/90 backdrop-blur-sm p-8 rounded-xl mt-8">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-oswald text-primary mb-2 uppercase tracking-wider">
              Generate Your Custom Workout Plan
            </h2>
            <p className="text-black text-xl">
              Create up to 12 days of personalized workouts instantly with our advanced computational algorithms
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-black mb-6">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border-2 border-black">
              <h3 className="font-oswald text-xl mb-2">Step 1</h3>
              <p>Input your fitness level and goals for technical development & strength progression</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border-2 border-black">
              <h3 className="font-oswald text-xl mb-2">Step 2</h3>
              <p>Select your preferred exercises and equipment availability</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border-2 border-black">
              <h3 className="font-oswald text-xl mb-2">Step 3</h3>
              <p>Get your personalized workout plan with built-in progression</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <ArrowDown className="w-8 h-8 text-primary animate-bounce" />
        <ArrowDown className="w-8 h-8 text-primary animate-bounce delay-100" />
        <ArrowDown className="w-8 h-8 text-primary animate-bounce delay-200" />
      </div>

      <div className="w-full max-w-3xl transform hover:scale-[0.99] transition-transform duration-200 border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] bg-white/90 backdrop-blur-sm p-8 rounded-xl mt-8">
        <h2 className="text-2xl font-oswald text-primary mb-4">Generate Custom Workouts</h2>
        {children}
      </div>
    </section>
  );
};