import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(7);
  const { toast } = useToast();

  const resetWorkouts = () => {
    setWorkouts(null);
  };

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          ...params,
          numberOfDays
        }
      });

      if (error) {
        console.error('Error generating workout:', error);
        toast({
          title: "Error",
          description: "Failed to generate workout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setWorkouts(data);
      setShowGenerateInput(false);
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
    <div className="relative min-h-screen bg-black">
      <div className="flex flex-col">
        <section className="min-h-screen relative">
          <div 
            className="fixed inset-0 bg-cover bg-center opacity-20 bg-fixed"
            style={{
              backgroundImage: "url('/lovable-uploads/0bcf4046-3564-4bd0-8091-c3deccd2f89d.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          />
          <div className="relative z-10 container mx-auto px-4 max-w-[1200px]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white mb-6 transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 mt-20 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]">
              strength.design
            </h1>
            <HeroSection>
              {showGenerateInput && (
                <GenerateWorkoutInput
                  generatePrompt={generatePrompt}
                  setGeneratePrompt={setGeneratePrompt}
                  handleGenerateWorkout={handleGenerateWorkout}
                  isGenerating={isGenerating}
                  setShowGenerateInput={setShowGenerateInput}
                  numberOfDays={numberOfDays}
                  setNumberOfDays={setNumberOfDays}
                />
              )}
            </HeroSection>
          </div>
        </section>

        <section className="relative">
          <div className="relative z-10 container mx-auto px-4 max-w-[1200px]">
            <FeaturesSection />
          </div>
        </section>

        <section className="relative">
          <div className="relative z-10 container mx-auto px-4 max-w-[1200px]">
            <SolutionsSection />
          </div>
        </section>

        <section className="relative">
          <div className="relative z-10 container mx-auto px-4 max-w-[1200px]">
            <TestimonialsSection />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;