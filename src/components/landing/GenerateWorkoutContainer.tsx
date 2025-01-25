import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Exercise } from "@/components/exercise-search/types";
import { Json } from "@/integrations/supabase/types";
import { PdfUploadSection } from "@/components/workout-generator/PdfUploadSection";

interface GenerateWorkoutContainerProps {
  setWorkouts: (workouts: any) => void;
}

export const GenerateWorkoutContainer = ({ setWorkouts }: GenerateWorkoutContainerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [prescribedExercises, setPrescribedExercises] = useState<string>("");

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await supabase.functions.invoke('process-file', {
        body: formData,
      });

      if (response.error) throw response.error;

      const { text } = response.data;
      setPrescribedExercises(text);
      
      toast({
        title: "Success",
        description: "File processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveGenerationInputs = async (params: {
    weatherData?: any;
    weatherPrompt?: string;
    selectedExercises: Exercise[];
    fitnessLevel?: string;
    prescribedExercises?: string;
    numberOfDays: number;
  }) => {
    try {
      const simplifiedExercises = params.selectedExercises.map(exercise => ({
        name: exercise.name,
        instructions: exercise.instructions
      })) as Json;

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
          prescribed_exercises: prescribedExercises || null,
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
          numberOfDays: 7,
          selectedExercises: [],
          prescribedExercises: prescribedExercises,
        }
      });

      if (error) throw error;

      console.log('Generated workout data:', data);
      setWorkouts(data);

      await saveGenerationInputs({
        selectedExercises: [],
        numberOfDays: 7,
        prescribedExercises: prescribedExercises,
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
      <div className="w-full max-w-md space-y-4">
        <PdfUploadSection onFileSelect={handleFileSelect} />
        <Button
          onClick={handleGenerateWorkout}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Generating..." : "Generate Workout"}
        </Button>
      </div>
    </div>
  );
};