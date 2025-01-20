import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { Button } from "@/components/ui/button";
import { EmailSubscriptionForm } from "./EmailSubscriptionForm";
import { useState } from "react";

interface HeroSectionProps {
  generatePrompt: string;
  setGeneratePrompt: (prompt: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (show: boolean) => void;
}

export const HeroSection = ({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput
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
      
      {/* Email Subscription Form */}
      {showSubscription && (
        <div className="w-full max-w-3xl bg-card p-8 rounded-xl mt-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-oswald text-primary">Stay Updated</h2>
            <p className="text-card-foreground">Subscribe to receive updates about our latest features and releases</p>
          </div>
          <EmailSubscriptionForm onSuccessfulSubscribe={() => setShowSubscription(false)} />
        </div>
      )}

      {/* Generate Search Section */}
      <div className="w-full max-w-3xl bg-card p-8 rounded-xl mt-8">
        <h2 className="text-2xl font-oswald text-primary mb-4">Generate Custom Workouts</h2>
        <GenerateWorkoutInput
          generatePrompt={generatePrompt}
          setGeneratePrompt={setGeneratePrompt}
          handleGenerateWorkout={handleGenerateWorkout}
          isGenerating={isGenerating}
          setShowGenerateInput={setShowGenerateInput}
        />
      </div>

      <div className="flex gap-4 mt-8">
        <Button size="lg" className="bg-primary text-white">
          View All Features
        </Button>
      </div>
    </section>
  );
};