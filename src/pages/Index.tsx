import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { exportToCalendar } from "@/utils/calendar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";

interface WorkoutDay {
  description: string;
  warmup: string;
  wod: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

const Index = () => {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const { toast } = useToast();
  const { isSpeaking, audioRef, handleSpeakWorkout } = useAudioPlayback();
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateWorkout = async () => {
    if (!generatePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for workout generation",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke<WeeklyWorkouts>('generate-weekly-workouts', {
        body: { prompt: generatePrompt }
      });

      if (error) throw error;

      if (data) {
        setWorkouts(data);
        toast({
          title: "Success",
          description: "Workouts generated successfully!",
        });
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: "Failed to generate workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetWorkouts = () => {
    setWorkouts(null);
    setGeneratePrompt("");
  };

  if (workouts) {
    return (
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isSpeaking={isSpeaking}
        isExporting={isExporting}
        handleSpeakWorkout={handleSpeakWorkout}
        audioRef={audioRef}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background min-h-screen">
      <HeroSection
        generatePrompt={generatePrompt}
        setGeneratePrompt={setGeneratePrompt}
        handleGenerateWorkout={handleGenerateWorkout}
        isGenerating={isGenerating}
        setShowGenerateInput={setShowGenerateInput}
      />
      
      <FeaturesSection />
      <SolutionsSection />
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-8 italic">
          Join a Community of Excellence
        </h2>
        <div className="w-full max-w-3xl mx-auto">
          <GenerateWorkoutInput
            generatePrompt={generatePrompt}
            setGeneratePrompt={setGeneratePrompt}
            handleGenerateWorkout={handleGenerateWorkout}
            isGenerating={isGenerating}
            setShowGenerateInput={setShowGenerateInput}
          />
        </div>
      </section>

      {/* CrossFit Link */}
      <div className="absolute top-4 right-4 max-w-md text-right">
        <Link to="/best-app-of-day" className="text-primary hover:underline font-bold inline-flex items-center">
          Check out our CrossFit focused builder
          <ChevronRight className="w-4 h-4" />
        </Link>
        <p className="text-sm text-foreground mt-2">
          CrossFit's unique blend of complex movements and intense metrics inspired our journey.
        </p>
      </div>
    </div>
  );
};

export default Index;