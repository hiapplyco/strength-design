import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Loader2 } from "lucide-react";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

export default function BestAppOfDay() {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [generatedWorkouts, setGeneratedWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { isSpeaking, audioRef, handleSpeakWorkout } = useAudioPlayback();

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

        toast({
          title: "Success",
          description: "Your workout plan has been generated!",
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

  const saveWorkouts = async (workoutsToSave: WeeklyWorkouts) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workoutPromises = Object.entries(workoutsToSave).map(([day, workout]) => {
        return supabase.from('workouts').insert({
          user_id: user.id,
          day,
          warmup: workout.warmup,
          wod: workout.workout,
          notes: workout.notes,
        });
      });

      await Promise.all(workoutPromises);
      setWorkouts(workoutsToSave);
      toast({
        title: "Success",
        description: "Workouts saved successfully!",
      });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <GenerateWorkoutInput
        generatePrompt={generatePrompt}
        setGeneratePrompt={setGeneratePrompt}
        handleGenerateWorkout={handleGenerateWorkout}
        isGenerating={isGenerating}
        setShowGenerateInput={setShowGenerateInput}
        numberOfDays={7}
        setNumberOfDays={() => {}}
      />
      {workouts && (
        <WorkoutDisplay
          workouts={workouts}
          resetWorkouts={resetWorkouts}
          isSpeaking={isSpeaking}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
          handleSpeakWorkout={handleSpeakWorkout}
          audioRef={audioRef}
        />
      )}
      <AuthDialog 
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Generating your workout plan...</p>
          </div>
        </div>
      )}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}