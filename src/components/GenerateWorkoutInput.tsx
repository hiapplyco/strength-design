import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "./exercise-search/types";
import { WeatherSection } from "./workout-generator/WeatherSection";
import { ExerciseSection } from "./workout-generator/ExerciseSection";
import { FitnessSection } from "./workout-generator/FitnessSection";
import { GenerateSection } from "./workout-generator/GenerateSection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface GenerateWorkoutInputProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (value: boolean) => void;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  location: string;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
}

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput,
}: GenerateWorkoutInputProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");

  const handleWeatherUpdate = (weatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(weatherData);
    setWeatherPrompt(weatherPrompt);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (!selectedExercises.some(e => e.name === exercise.name)) {
      setSelectedExercises(prev => [...prev, exercise]);
    }
  };

  const handleGenerateWithWeather = () => {
    const exercisesPrompt = selectedExercises.length > 0 
      ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
      : "";
    
    const fitnessPrompt = fitnessLevel 
      ? ` Consider this fitness profile: ${fitnessLevel}.`
      : "";
    
    const fullPrompt = `${generatePrompt}${weatherPrompt ? ` ${weatherPrompt}` : ""}${exercisesPrompt}${fitnessPrompt}`;
    setGeneratePrompt(fullPrompt);
    handleGenerateWorkout();
  };

  const handleClear = () => {
    setGeneratePrompt("");
    setWeatherData(null);
    setWeatherPrompt("");
    setSelectedExercises([]);
    setFitnessLevel("");
  };

  const renderTooltip = (content: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center">
          <HelpCircle className="h-4 w-4 text-accent ml-2" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs bg-[#D4B96D] text-black">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col w-full gap-6 bg-muted/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-accent">Weather Conditions</h3>
          {renderTooltip(
            "Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment."
          )}
        </div>
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
        />
        
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-accent">Available Equipment</h3>
          {renderTooltip(
            "Add specific equipment or exercises you have access to. This helps create workouts that match your available resources."
          )}
        </div>
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
        />

        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-accent">Your Fitness Profile</h3>
          {renderTooltip(
            "Share your fitness level and experience to receive personalized workouts that match your capabilities."
          )}
        </div>
        <FitnessSection
          fitnessLevel={fitnessLevel}
          onFitnessLevelChange={setFitnessLevel}
        />

        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-accent">Generate Your Program</h3>
          {renderTooltip(
            "Review your selections and generate a custom workout program tailored to your needs."
          )}
        </div>
        <GenerateSection
          generatePrompt={generatePrompt}
          onGeneratePromptChange={setGeneratePrompt}
          onGenerate={handleGenerateWithWeather}
          onClear={handleClear}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}