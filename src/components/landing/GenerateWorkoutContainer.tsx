import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";
import { GenerateWorkoutInput } from "../GenerateWorkoutInput";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { generateWorkout, saveWorkouts } from "@/utils/workoutGeneration";
import type { WeeklyWorkouts } from "@/utils/workoutGeneration";
import type { Exercise } from "../exercise-search/types";

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

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    try {
      setIsGenerating(true);
      
      const workouts = await generateWorkout({
        ...params,
        numberOfDays,
      });

      setGeneratedWorkouts(workouts);
      setWorkouts(workouts);
      
      toast({
        title: "Success",
        description: "Your workout plan has been generated!",
      });
      triggerConfetti();

    } catch (error: any) {
      console.error('Error in handleGenerateWorkout:', error);
      const errorMessage = error.message || "Failed to generate workouts. Please try again.";
      
      console.error('Detailed error:', {
        message: errorMessage,
        originalError: error
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuthSuccess = async () => {
    console.log("Auth success handler called");
    setShowAuthDialog(false);
    if (generatedWorkouts) {
      console.log("Saving generated workouts after auth");
      const saved = await saveWorkouts(generatedWorkouts);
      if (saved) {
        setWorkouts(generatedWorkouts);
      }
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
      {isGenerating && <LoadingIndicator />}
    </>
  );
}