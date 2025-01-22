import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { triggerConfetti } from "@/utils/confetti";
import { GenerateWorkoutInput } from "../GenerateWorkoutInput";
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

interface GenerateWorkoutContainerProps {
  setWorkouts: (workouts: WeeklyWorkouts | null) => void;
}

export function GenerateWorkoutContainer({ setWorkouts }: GenerateWorkoutContainerProps) {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [generatedWorkouts, setGeneratedWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [numberOfDays, setNumberOfDays] = useState(7);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const { toast } = useToast();

  const handleGenerateWorkout = async () => {
    try {
      setIsGenerating(true);
      console.log("Starting workout generation");
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Auth check result:", user ? "User found" : "No user");
      
      if (!user) {
        console.log("No user found, showing auth dialog");
        setIsNewUser(true);
        setShowAuthDialog(true);
        setIsGenerating(false);
        return;
      }

      console.log("Calling generate-weekly-workouts function with params:", {
        prompt: generatePrompt,
        numberOfDays,
        weatherPrompt: "",
        selectedExercises: [],
        fitnessLevel: "",
        prescribedExercises: ""
      });

      const { data, error: functionError } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: { 
          prompt: generatePrompt,
          numberOfDays,
          weatherPrompt: "",
          selectedExercises: [],
          fitnessLevel: "",
          prescribedExercises: ""
        }
      });

      console.log("Function response received:", { 
        success: !!data, 
        error: functionError,
        data: data 
      });

      if (functionError) {
        console.error("Function error:", functionError);
        throw new Error(functionError.message || 'Error generating workouts');
      }

      if (!data) {
        console.error("No data received from function");
        throw new Error("No workout data received");
      }

      if ('error' in data) {
        console.error("API error:", data.error);
        throw new Error(data.error);
      }

      console.log("Setting generated workouts:", data);
      setGeneratedWorkouts(data);
      
      console.log("Saving workouts to database");
      await saveWorkouts(data);
      
      toast({
        title: "Success",
        description: "Your workout plan has been generated!",
      });
      triggerConfetti();

    } catch (error) {
      console.error('Error in handleGenerateWorkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveWorkouts = async (workoutsToSave: WeeklyWorkouts) => {
    try {
      console.log("Starting saveWorkouts");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user in saveWorkouts, showing auth dialog");
        setShowAuthDialog(true);
        return;
      }

      console.log("Creating workout promises");
      const workoutPromises = Object.entries(workoutsToSave).map(([day, workout]) => {
        return supabase.from('workouts').insert({
          user_id: user.id,
          day,
          warmup: workout.warmup,
          workout: workout.workout,
          notes: workout.notes,
          strength: workout.strength,
          description: workout.description
        });
      });

      console.log("Executing workout promises");
      await Promise.all(workoutPromises);
      setWorkouts(workoutsToSave);
      toast({
        title: "Success",
        description: "Workouts saved successfully!",
      });
    } catch (error) {
      console.error('Error in saveWorkouts:', error);
      toast({
        title: "Error",
        description: "Failed to save workouts. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleAuthSuccess = async () => {
    console.log("Auth success handler called");
    setShowAuthDialog(false);
    if (generatedWorkouts) {
      console.log("Saving generated workouts after auth");
      await saveWorkouts(generatedWorkouts);
    }
  };

  return (
    <>
      <GenerateWorkoutInput
        generatePrompt={generatePrompt}
        setGeneratePrompt={setGeneratePrompt}
        handleGenerateWorkout={handleGenerateWorkout}
        isGenerating={isGenerating}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        setShowGenerateInput={setShowGenerateInput}
      />
      <AuthDialog 
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
        isNewUser={isNewUser}
      />
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium text-white">Generating your workout plan...</p>
          </div>
        </div>
      )}
    </>
  );
}
