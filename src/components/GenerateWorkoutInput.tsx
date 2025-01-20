import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "./exercise-search/types";
import { WeatherSection } from "./workout-generator/WeatherSection";
import { ExerciseSection } from "./workout-generator/ExerciseSection";
import { FitnessSection } from "./workout-generator/FitnessSection";
import { GenerateSection } from "./workout-generator/GenerateSection";

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

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col w-full gap-6 bg-muted/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
        />
        
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
        />

        <FitnessSection
          fitnessLevel={fitnessLevel}
          onFitnessLevelChange={setFitnessLevel}
        />

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