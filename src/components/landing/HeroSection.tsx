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
}

export const HeroSection = ({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput
}: HeroSectionProps) => {
  const [showSubscription, setShowSubscription] = useState(true);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      triggerConfetti();
    }
  };

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
        <div className="w-full max-w-3xl bg-card/90 backdrop-blur-sm p-8 rounded-xl mt-8 shadow-lg">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-oswald text-primary">Stay Updated</h2>
            <p className="text-black">Subscribe to receive updates about our latest features and releases</p>
          </div>
          <EmailSubscriptionForm onSuccessfulSubscribe={() => setShowSubscription(false)} />
        </div>
      )}

      {/* New Free Workout Generation Section */}
      <div className="w-full max-w-3xl bg-primary p-8 rounded-xl mt-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-oswald text-white mb-2 uppercase tracking-wider">
            🎉 Generate Your First Week FREE! 🎉
          </h2>
          <p className="text-white text-xl">
            Create a complete week of personalized workouts instantly! Our advanced computational algorithms analyze your goals and preferences to design the perfect progression.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-white mb-6">
          <div className="bg-black/20 p-4 rounded-lg">
            <h3 className="font-oswald text-xl mb-2">Monday-Wednesday</h3>
            <p>Progressive Overload & Technical Development</p>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <h3 className="font-oswald text-xl mb-2">Thursday-Friday</h3>
            <p>Metabolic Optimization & Power Output</p>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <h3 className="font-oswald text-xl mb-2">Weekend</h3>
            <p>Active Recovery & Movement Restoration</p>
          </div>
        </div>
      </div>

      {/* Arrows pointing to generate section */}
      <div className="flex justify-center space-x-4">
        <ArrowDown className="w-8 h-8 text-primary animate-bounce" />
        <ArrowDown className="w-8 h-8 text-primary animate-bounce delay-100" />
        <ArrowDown className="w-8 h-8 text-primary animate-bounce delay-200" />
      </div>

      {/* Generate Search Section */}
      <div className="w-full max-w-3xl bg-card/90 backdrop-blur-sm p-8 rounded-xl mt-8 shadow-lg">
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
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary text-white">
              View All Features
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-oswald text-primary mb-4">
                STRENGTH.DESIGN: Redefining Fitness Programming for a Stronger Future
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-black">
              <p className="leading-relaxed">
                STRENGTH.DESIGN is the ultimate tool for coaches, athletes, and fitness enthusiasts to revolutionize the way they approach training. Built on cutting-edge science, real-world data, and the principles of periodization, our platform empowers you to design precision-tailored programs that drive results.
              </p>
              <p className="leading-relaxed">
                Whether you're preparing for the CrossFit Open, improving Olympic lifts, or simply building functional strength, STRENGTH.DESIGN equips you with scalable tools to train smarter.
              </p>
              <blockquote className="border-l-4 border-primary pl-4 italic">
                "I've cut my programming time in half while delivering more effective workouts," says elite CrossFit coach Sarah P. "My athletes are setting PRs every week!"
              </blockquote>
              <p className="leading-relaxed">
                From algorithm-driven periodization to real-time feedback tools, Strength.Design doesn't just optimize programming—it creates opportunities to grow your coaching business and connect with athletes worldwide. Your expertise, amplified by science, is the future of fitness.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};