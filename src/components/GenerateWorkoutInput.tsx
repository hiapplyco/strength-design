import { useState } from "react";
import type { Exercise } from "./exercise-search/types";
import type { WeatherData } from "@/types/weather";
import { WeatherSection } from "./workout-generator/WeatherSection";
import { ExerciseSection } from "./workout-generator/ExerciseSection";
import { FitnessLevelSection } from "./workout-generator/FitnessLevelSection";
import { PrescribedExercisesSection } from "./workout-generator/PrescribedExercisesSection";
import { InjuriesSection } from "./workout-generator/InjuriesSection";
import { GenerateSection } from "./workout-generator/GenerateSection";
import { DaysSelection } from "./workout-generator/DaysSelection";
import { TooltipWrapper } from "./workout-generator/TooltipWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell } from "lucide-react";

interface GenerateWorkoutInputProps {
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

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays
}: GenerateWorkoutInputProps) {
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

  const isValid = fitnessLevel !== "" && numberOfDays > 0;

  const handleGenerateWithWeather = async () => {
    if (!isValid) return;

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
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className={`relative bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 p-8 space-y-8 ${isGenerating ? 'before:absolute before:inset-0 before:rounded-lg before:border-4 before:border-primary before:animate-[gradient_3s_ease_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent' : ''}`}>
        {/* Weather Section */}
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          renderTooltip={() => (
            <TooltipWrapper content="Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment." />
          )}
        />
        
        {/* Exercise Search Section */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Search Exercises & Equipment</h3>
            <TooltipWrapper content="Add specific equipment or exercises you have access to. This helps create workouts that match your available resources." />
          </div>
          <ExerciseSection
            selectedExercises={selectedExercises}
            onExerciseSelect={handleExerciseSelect}
            renderTooltip={() => (
              <TooltipWrapper content="Add specific equipment or exercises you have access to. This helps create workouts that match your available resources." />
            )}
          />
        </div>

        {/* Fitness Level Section */}
        <FitnessLevelSection
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
        />

        {/* Prescribed Exercises Section */}
        <PrescribedExercisesSection
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
          isAnalyzingPrescribed={isAnalyzingPrescribed}
          handlePrescribedFileSelect={handlePrescribedFileSelect}
        />

        {/* Injuries Section */}
        <InjuriesSection
          injuries={injuries}
          setInjuries={setInjuries}
          isAnalyzingInjuries={isAnalyzingInjuries}
          handleInjuriesFileSelect={handleInjuriesFileSelect}
        />

        {/* Days Selection */}
        <DaysSelection
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          renderTooltip={() => (
            <TooltipWrapper content="Select the number of days for your workout program." />
          )}
        />

        {/* Generate Section */}
        <GenerateSection
          onGenerate={startGenerating}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={isValid}
          renderTooltip={() => (
            <TooltipWrapper content="Review your selections and generate a custom workout program tailored to your needs." />
          )}
        />
      </div>
    </div>
  );
}