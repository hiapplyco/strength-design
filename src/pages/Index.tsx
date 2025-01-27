import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      {/* Header Section */}
      <div className="w-full bg-black py-8">
        <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] max-w-3xl mx-auto">
          strength.design
        </h1>
      </div>

      {/* Video Section */}
      <section className="relative h-screen mb-12 w-full overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/videos/S.D.mov?t=2025-01-27T00%3A24%3A48.059Z" type="video/mp4" />
          </video>
        </div>

        <Button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70"
          size="icon"
          variant="ghost"
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
      </section>

      {/* Content Sections */}
      <div className="relative">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <HeroSection>
            {showGenerateInput && (
              <GenerateWorkoutInput
                generatePrompt={generatePrompt}
                setGeneratePrompt={setGeneratePrompt}
                handleGenerateWorkout={handleGenerateWorkout}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                setShowGenerateInput={setShowGenerateInput}
                numberOfDays={numberOfDays}
                setNumberOfDays={setNumberOfDays}
              />
            )}
          </HeroSection>
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
      </div>
    </div>
  );
};

export default Index;