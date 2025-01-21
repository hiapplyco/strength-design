import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { exportToCalendar } from "@/utils/calendar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { triggerConfetti } from "@/utils/confetti";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

const Index = () => {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [generatedWorkouts, setGeneratedWorkouts] = useState<WeeklyWorkouts | null>(null);
  const { toast } = useToast();
  const { isSpeaking, audioRef, handleSpeakWorkout } = useAudioPlayback();
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

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
        setGeneratedWorkouts(data);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await saveWorkouts(data);
        } else {
          setShowAuthDialog(true);
        }
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

  const saveWorkouts = async (workoutsToSave: WeeklyWorkouts) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workoutPromises = Object.entries(workoutsToSave).map(([day, workout]) => 
        supabase.from('workouts').insert({
          user_id: user.id,
          day,
          warmup: workout.warmup,
          wod: workout.workout,
          notes: workout.notes,
        })
      );

      await Promise.all(workoutPromises);
      setWorkouts(workoutsToSave);
      toast({
        title: "Success",
        description: "Workouts generated and saved successfully!",
      });
      triggerConfetti();
    } catch (error) {
      console.error('Error saving workouts:', error);
      toast({
        title: "Error",
        description: "Failed to save workouts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthDialog(false);
    if (generatedWorkouts) {
      await saveWorkouts(generatedWorkouts);
    }
  };

  const resetWorkouts = () => {
    setWorkouts(null);
    setGeneratePrompt("");
    setGeneratedWorkouts(null);
  };

  if (workouts) {
    return (
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isSpeaking={isSpeaking}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
        handleSpeakWorkout={handleSpeakWorkout}
        audioRef={audioRef}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 z-0"
        style={{
          backgroundImage: "url('/lovable-uploads/0bcf4046-3564-4bd0-8091-c3deccd2f89d.png')",
        }}
      />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 animate-fade-in backdrop-blur-sm">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-collegiate text-destructive mb-12 transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-8 py-6 mt-20 shadow-[8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]">
            strength.design
          </h1>
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
        </div>
      </div>
      <AuthDialog 
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default Index;