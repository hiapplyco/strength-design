import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { VideoSection } from "@/components/landing/VideoSection";
import { Footer } from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";

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
  const [isMuted, setIsMuted] = useState(true);
  const { toast } = useToast();

  const resetWorkouts = () => {
    setWorkouts(null);
    setShowGenerateInput(true);
  };

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    setIsGenerating(true);
    const startTime = performance.now();

    try {
      // Store input data in session_io table
      const { error: sessionError } = await supabase.from('session_io').insert({
        weather_prompt: params.weatherPrompt,
        selected_exercises: params.selectedExercises,
        fitness_level: params.fitnessLevel,
        prescribed_exercises: params.prescribedExercises,
        number_of_days: numberOfDays,
        session_duration_ms: 0, // Will be updated after workout generation
        success: false // Will be updated after successful generation
      });

      if (sessionError) {
        console.error('Error storing session:', sessionError);
      }

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

      // Update session with generated workouts and success status
      const sessionDuration = Math.round(performance.now() - startTime);
      const { error: updateError } = await supabase
        .from('session_io')
        .update({
          generated_workouts: data,
          session_duration_ms: sessionDuration,
          success: true
        })
        .eq('session_duration_ms', 0) // Update the session we just created
        .eq('success', false);

      if (updateError) {
        console.error('Error updating session:', updateError);
      }

      setWorkouts(data);
      setShowGenerateInput(false);
      triggerConfetti();
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

  const toggleMute = () => {
    const video = document.querySelector('video');
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
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
    <div className="min-h-screen bg-black">
      <div className="w-full bg-black pt-24 pb-8">
        <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] max-w-3xl mx-auto">
          strength.design
        </h1>
      </div>

      <VideoSection isMuted={isMuted} onToggleMute={toggleMute} />

      <div className="relative">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <HeroSection />
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <FeaturesSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <SolutionsSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <TestimonialsSection />
          </div>
        </div>

        <div className="relative py-20">
          <Separator className="mb-20 bg-primary/20" />
          <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-4">
                Try Our Free Workout Generator
              </h2>
              <p className="text-lg text-white">
                Experience the power of AI-driven workout planning with our free generator
              </p>
            </div>
            <div id="generate-workout">
              <GenerateWorkoutInput
                generatePrompt={generatePrompt}
                setGeneratePrompt={setGeneratePrompt}
                handleGenerateWorkout={handleGenerateWorkout}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                showGenerateInput={showGenerateInput}
                setShowGenerateInput={setShowGenerateInput}
                numberOfDays={numberOfDays}
                setNumberOfDays={setNumberOfDays}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;