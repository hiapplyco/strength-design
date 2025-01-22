import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { GenerateWorkoutContainer } from "@/components/landing/GenerateWorkoutContainer";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

const Index = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const resetWorkouts = () => {
    setWorkouts(null);
  };

  if (workouts) {
    return (
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
      />
    );
  }

  return (
    <div className="relative min-h-screen backdrop-blur-sm">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage: "url('/lovable-uploads/0bcf4046-3564-4bd0-8091-c3deccd2f89d.png')",
        }}
      />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-oswald font-bold text-destructive dark:text-white mb-12 transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-8 py-6 mt-20 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]">
            strength.design
          </h1>
          <HeroSection
            generatePrompt=""
            setGeneratePrompt={() => {}}
            handleGenerateWorkout={() => {}}
            isGenerating={false}
            setShowGenerateInput={() => {}}
            numberOfDays={7}
            setNumberOfDays={() => {}}
          >
            <GenerateWorkoutContainer setWorkouts={setWorkouts} />
          </HeroSection>
          <FeaturesSection />
          <SolutionsSection />
          <TestimonialsSection />
        </div>
      </div>
    </div>
  );
};

export default Index;