import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWeatherState } from "./useWeatherState";
import { useExerciseState } from "./useExerciseState";
import { useFileAnalysis } from "./useFileAnalysis";

const STORAGE_KEY = "workout_generator_inputs";

interface UseWorkoutGenerationProps {
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => Promise<void>;
  setIsGenerating: (value: boolean) => void;
  setGeneratePrompt: (value: string) => void;
}

export const useWorkoutGeneration = ({
  handleGenerateWorkout,
  setIsGenerating,
  setGeneratePrompt
}: UseWorkoutGenerationProps) => {
  const { toast } = useToast();
  const { weatherData, weatherPrompt, handleWeatherUpdate } = useWeatherState();
  const { selectedExercises, fitnessLevel, setFitnessLevel, handleExerciseSelect } = useExerciseState();
  const {
    prescribedExercises,
    setPrescribedExercises,
    injuries,
    setInjuries,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    handlePrescribedFileSelect,
    handleInjuriesFileSelect
  } = useFileAnalysis();

  // Load saved inputs on mount
  useEffect(() => {
    const savedInputs = localStorage.getItem(STORAGE_KEY);
    if (savedInputs) {
      const parsed = JSON.parse(savedInputs);
      handleWeatherUpdate(parsed.weatherData, parsed.weatherPrompt);
      setFitnessLevel(parsed.fitnessLevel);
      setPrescribedExercises(parsed.prescribedExercises);
      setInjuries(parsed.injuries);
    }
  }, []);

  // Save inputs whenever they change
  useEffect(() => {
    const inputs = {
      weatherData,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries,
      numberOfDays: 7 // Default value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [weatherData, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, injuries]);

  const handleGenerateWithWeather = async (numberOfDays: number) => {
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
      await handleGenerateWorkout({
        prompt: fullPrompt,
        weatherPrompt,
        selectedExercises,
        fitnessLevel,
        prescribedExercises
      });
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleClear = () => {
    setGeneratePrompt("");
    handleWeatherUpdate(null, "");
    setFitnessLevel("");
    setPrescribedExercises("");
    setInjuries("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    weatherData,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    handleWeatherUpdate,
    handleExerciseSelect,
    handlePrescribedFileSelect,
    handleInjuriesFileSelect,
    handleGenerateWithWeather,
    handleClear,
    setFitnessLevel,
    setPrescribedExercises,
    setInjuries
  };
};
