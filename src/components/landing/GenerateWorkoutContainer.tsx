import { useState } from "react";
import { triggerConfetti } from "@/utils/confetti";
import { GenerateWorkoutInput } from "../GenerateWorkoutInput";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { generateWorkout, saveWorkoutNoAuth } from "@/utils/workoutGeneration";
import { ContactDialog } from "./ContactDialog";
import type { WeeklyWorkouts } from "@/utils/workoutGeneration";
import type { Exercise } from "../exercise-search/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerateWorkoutContainerProps {
  setWorkouts: (workouts: WeeklyWorkouts | null) => void;
}

export function GenerateWorkoutContainer({ setWorkouts }: GenerateWorkoutContainerProps) {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(7);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const { toast } = useToast();

  const saveGenerationInputs = async (params: {
    weatherPrompt: string;
    weatherData: any;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
    numberOfDays: number;
  }) => {
    try {
      // Transform the Exercise[] array into a simple array of objects
      const simplifiedExercises = params.selectedExercises.map(exercise => ({
        name: exercise.name,
        instructions: exercise.instructions
      }));

      const { error } = await supabase
        .from('workout_generation_inputs')
        .insert({
          weather_data: params.weatherData ? JSON.parse(JSON.stringify(params.weatherData)) : null,
          weather_prompt: params.weatherPrompt || null,
          selected_exercises: simplifiedExercises,
          fitness_level: params.fitnessLevel || null,
          prescribed_exercises: params.prescribedExercises || null,
          number_of_days: params.numberOfDays
        });

      if (error) {
        console.error('Error saving generation inputs:', error);
      }
    } catch (error) {
      console.error('Error in saveGenerationInputs:', error);
    }
  };

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    try {
      setIsGenerating(true);
      console.log("Starting workout generation with params:", params);
      
      // Save the generation inputs
      await saveGenerationInputs({
        ...params,
        numberOfDays,
        weatherData: null // We'll need to pass this from the WeatherSection if needed
      });
      
      const workouts = await generateWorkout({
        ...params,
        numberOfDays,
      });

      console.log("Generated workouts:", workouts);
      setWorkouts(workouts);
      
      // Save workouts without authentication
      await saveWorkoutNoAuth(workouts);
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
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="generate-workout">
      <GenerateWorkoutInput
        generatePrompt={generatePrompt}
        setGeneratePrompt={setGeneratePrompt}
        handleGenerateWorkout={handleGenerateWorkout}
        isGenerating={isGenerating}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        setShowGenerateInput={setShowGenerateInput}
      />
      <div className="mt-8 flex justify-center">
        <ContactDialog buttonText="Get Enterprise Access" variant="secondary" />
      </div>
      {isGenerating && <LoadingIndicator />}
    </div>
  );
}