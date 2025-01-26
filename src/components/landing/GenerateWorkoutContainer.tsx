import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Exercise } from "@/components/exercise-search/types";
import { Json } from "@/integrations/supabase/types";
import { PdfUploadSection } from "@/components/workout-generator/PdfUploadSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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

      if (response.error) {
        console.error('Edge Function error:', response.error);
        throw response.error;
      }

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

  const handleGenerateWorkout = async () => {
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      console.log('Starting workout generation...');
      
      const { data: workoutData, error: workoutError } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          numberOfDays: 7,
          selectedExercises: [],
          prescribedExercises: prescribedExercises
        }
      });

      if (workoutError) {
        console.error('Supabase function error:', workoutError);
        throw workoutError;
      }

      if (!workoutData) {
        throw new Error('No data received from workout generation');
      }

      console.log('Generated workout data:', workoutData);
      setWorkouts(workoutData);

      // Calculate session duration
      const endTime = performance.now();
      const sessionDuration = Math.round(endTime - startTime);

      // Save session data to session_io table
      const { error: sessionError } = await supabase
        .from('session_io')
        .insert({
          prescribed_exercises: prescribedExercises,
          number_of_days: 7,
          generated_workouts: workoutData,
          session_duration_ms: sessionDuration,
          success: true
        });

      if (sessionError) {
        console.error('Error saving session data:', sessionError);
        // Don't throw here as the workout generation was successful
      }

      toast({
        title: "Success",
        description: "Workout generated successfully!",
      });

    } catch (error) {
      console.error('Error generating workout:', error);
      
      // Save failed session
      await supabase
        .from('session_io')
        .insert({
          prescribed_exercises: prescribedExercises,
          number_of_days: 7,
          session_duration_ms: Math.round(performance.now() - startTime),
          success: false,
          error_message: error.message || "Unknown error occurred"
        });

      toast({
        title: "Error",
        description: error.message || "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Your Exercise Program</CardTitle>
          <CardDescription>
            Upload a PDF or image file containing your prescribed exercises or physical therapy program. 
            We'll analyze it and create a workout plan that incorporates these exercises.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PdfUploadSection onFileSelect={handleFileSelect} />
          
          {prescribedExercises && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-sm">Extracted Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {prescribedExercises}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleGenerateWorkout}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Generating..." : "Generate Workout"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};