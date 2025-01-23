import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  numberOfDays: number;
  setNumberOfDays: (days: number) => void;
  children?: React.ReactNode;
}

export const HeroSection = ({
  onSubmit,
  isLoading,
  numberOfDays,
  setNumberOfDays,
  children
}: HeroSectionProps) => {
  return (
    <section className="flex flex-col items-center justify-center space-y-8 pt-12 pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-6xl font-oswald text-primary">
          AI-Powered Workout Generator
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto">
          Empower your fitness business and members with science-backed, data-driven workouts tailored for every goal
        </p>
      </div>

      <div className="w-full relative">
        <div className="relative z-10 max-w-7xl mx-auto transform hover:scale-[0.99] transition-transform duration-200 border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] bg-white/90 backdrop-blur-sm p-8 rounded-xl mt-8">
          <GenerateWorkoutInput
            onSubmit={onSubmit}
            isLoading={isLoading}
            numberOfDays={numberOfDays}
            setNumberOfDays={setNumberOfDays}
          />
          {children}
        </div>
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="animate-bounce"
        onClick={() => {
          const element = document.getElementById('features');
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <ArrowDown className="h-4 w-4 mr-2" />
        Learn More
      </Button>
    </section>
  );
};