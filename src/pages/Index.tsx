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
    <div className="relative min-h-screen">
      <div className="flex flex-col">
        {/* Hero Section with background */}
        <section className="min-h-screen relative bg-gradient-to-b from-black/20 to-[#1A1F2C]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: "url('/lovable-uploads/0bcf4046-3564-4bd0-8091-c3deccd2f89d.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 max-w-[1400px] mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white mb-6 transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 mt-20 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]">
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
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-[#403E43] relative">
          <div className="relative z-10">
            <FeaturesSection />
          </div>
        </section>

        {/* Solutions Section */}
        <section className="bg-[#8A898C] relative">
          <div className="relative z-10">
            <SolutionsSection />
          </div>
        </section>

        {/* Final Section */}
        <section className="bg-[#9F9EA1] relative">
          <div className="relative z-10">
            <TestimonialsSection />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;