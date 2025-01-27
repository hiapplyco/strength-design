import { useState } from "react";
import type { Exercise } from "../exercise-search/types";
import type { WeatherData } from "@/types/weather";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutGeneratorForm } from "./WorkoutGeneratorForm";
import { motion, AnimatePresence } from "framer-motion";

interface InputContainerProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => Promise<void>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function InputContainer({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays
}: InputContainerProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");
  const [prescribedExercises, setPrescribedExercises] = useState<string>("");
  const [injuries, setInjuries] = useState<string>("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);
  const { toast } = useToast();

  const handleWeatherUpdate = (weatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(weatherData);
    setWeatherPrompt(weatherPrompt);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      if (prev.some(e => e.name === exercise.name)) {
        return prev.filter(e => e.name !== exercise.name);
      }
      return [...prev, exercise];
    });
  };

  const handlePrescribedFileSelect = async (file: File) => {
    try {
      setIsAnalyzingPrescribed(true);
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
        description: "Exercise program processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingPrescribed(false);
    }
  };

  const handleInjuriesFileSelect = async (file: File) => {
    try {
      setIsAnalyzingInjuries(true);
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
      setInjuries(text);
      
      toast({
        title: "Success",
        description: "Medical document processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingInjuries(false);
    }
  };

  const handleGenerateWithWeather = async () => {
    if (!fitnessLevel || numberOfDays <= 0) return;

    if (typeof window !== 'undefined' && window.gtagSendEvent) {
      window.gtagSendEvent();
    }

    const prompts = {
      exercises: selectedExercises.length > 0 
        ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
        : "",
      fitness: fitnessLevel ? ` Consider this fitness profile: ${fitnessLevel}.` : "",
      prescribed: prescribedExercises ? ` Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.` : "",
      injuries: injuries ? ` Please consider these health conditions/injuries: ${injuries}.` : ""
    };
    
    const fullPrompt = `${weatherPrompt}${prompts.exercises}${prompts.fitness}${prompts.prescribed}${prompts.injuries}`;
    
    console.log('Generating workout with params:', {
      numberOfDays,
      weatherPrompt,
      selectedExercises: selectedExercises.length,
      fitnessLevel,
      hasPrescribed: !!prescribedExercises,
      hasInjuries: !!injuries
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          prompt: fullPrompt,
          weatherPrompt,
          selectedExercises,
          fitnessLevel,
          prescribedExercises,
          injuries,
          numberOfDays
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        toast({
          title: "Error",
          description: `Failed to generate workout: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        console.error('No data received from edge function');
        toast({
          title: "Error",
          description: "No workout data received. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Validate we have the correct number of days
      const workoutDays = Object.keys(data).length;
      console.log(`Received ${workoutDays} days of workouts, expected ${numberOfDays}`);
      
      if (workoutDays !== numberOfDays) {
        console.error(`Mismatch in number of days: got ${workoutDays}, expected ${numberOfDays}`);
        toast({
          title: "Error",
          description: "Incomplete workout generated. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await handleGenerateWorkout({
        prompt: fullPrompt,
        weatherPrompt,
        selectedExercises,
        fitnessLevel,
        prescribedExercises
      });
      
      handleClear();
    } catch (error) {
      console.error("Error generating workout:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setGeneratePrompt("");
    setWeatherData(null);
    setWeatherPrompt("");
    setSelectedExercises([]);
    setFitnessLevel("");
    setPrescribedExercises("");
    setInjuries("");
  };

  const startGenerating = () => {
    setIsGenerating(true);
    requestAnimationFrame(() => {
      handleGenerateWithWeather();
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl mx-auto px-4"
      >
        <WorkoutGeneratorForm
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
          isAnalyzingPrescribed={isAnalyzingPrescribed}
          handlePrescribedFileSelect={handlePrescribedFileSelect}
          injuries={injuries}
          setInjuries={setInjuries}
          isAnalyzingInjuries={isAnalyzingInjuries}
          handleInjuriesFileSelect={handleInjuriesFileSelect}
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          onGenerate={startGenerating}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={fitnessLevel !== "" && numberOfDays > 0}
        />
      </motion.div>
    </AnimatePresence>
  );
}