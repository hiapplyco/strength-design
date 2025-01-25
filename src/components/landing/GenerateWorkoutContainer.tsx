import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Exercise } from "@/components/exercise-search/types";
import { Json } from "@/integrations/supabase/types";

interface GenerateWorkoutContainerProps {
  setWorkouts: (workouts: any) => void;
}

export const GenerateWorkoutContainer = ({ setWorkouts }: GenerateWorkoutContainerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveGenerationInputs = async (params: {
    weatherData?: any;
    weatherPrompt?: string;
    selectedExercises: Exercise[];
    fitnessLevel?: string;
    prescribedExercises?: string;
    numberOfDays: number;
  }) => {
    try {
      // Transform the Exercise[] array into a format that matches Json type
      const simplifiedExercises = params.selectedExercises.map(exercise => ({
        name: exercise.name,
        instructions: exercise.instructions
      })) as Json;

      // Ensure weatherData is properly serialized as Json
      const serializedWeatherData = params.weatherData ? 
        JSON.parse(JSON.stringify(params.weatherData)) as Json : 
        null;

      const { error } = await supabase
        .from('workout_generation_inputs')
        .insert({
          weather_data: serializedWeatherData,
          weather_prompt: params.weatherPrompt || null,
          selected_exercises: simplifiedExercises,
          fitness_level: params.fitnessLevel || null,
          prescribed_exercises: params.prescribedExercises || null,
          number_of_days: params.numberOfDays
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving generation inputs:', error);
      toast({
        title: "Error",
        description: "Failed to save workout generation inputs",
        variant: "destructive",
      });
    }
  };

  const handleGenerateWorkout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          numberOfDays: 7, // Default to 7 days
          selectedExercises: [], // Add actual exercises here when implemented
        }
      });

      if (error) throw error;

      console.log('Generated workout data:', data);
      setWorkouts(data);

      // Save the generation inputs
      await saveGenerationInputs({
        selectedExercises: [], // Add actual exercises here when implemented
        numberOfDays: 7, // Default to 7 days
      });

    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <Button
        onClick={handleGenerateWorkout}
        disabled={isLoading}
        className="w-full max-w-md"
      >
        {isLoading ? "Generating..." : "Generate Workout"}
      </Button>
    </div>
  );
};