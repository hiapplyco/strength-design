import { useState } from "react";
import type { Exercise } from "./exercise-search/types";
import type { WeatherData } from "@/types/weather";
import { WeatherSection } from "./workout-generator/WeatherSection";
import { ExerciseSection } from "./workout-generator/ExerciseSection";
import { FitnessSection } from "./workout-generator/FitnessSection";
import { GenerateSection } from "./workout-generator/GenerateSection";
import { DaysSelection } from "./workout-generator/DaysSelection";
import { TooltipWrapper } from "./workout-generator/TooltipWrapper";

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
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays
}: GenerateWorkoutInputProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");
  const [prescribedExercises, setPrescribedExercises] = useState<string>("");

  const handleWeatherUpdate = (weatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(weatherData);
    setWeatherPrompt(weatherPrompt);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (!selectedExercises.some(e => e.name === exercise.name)) {
      setSelectedExercises(prev => [...prev, exercise]);
    }
  };

  const isValid = fitnessLevel !== "" && numberOfDays > 0;

  const handleGenerateWithWeather = async () => {
    if (!isValid) return;

    const prompts = {
      exercises: selectedExercises.length > 0 
        ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
        : "",
      fitness: fitnessLevel ? ` Consider this fitness profile: ${fitnessLevel}.` : "",
      prescribed: prescribedExercises ? ` Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.` : ""
    };
    
    const fullPrompt = `${weatherPrompt}${prompts.exercises}${prompts.fitness}${prompts.prescribed}`;
    
    try {
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
    }
  };

  const handleClear = () => {
    setGeneratePrompt("");
    setWeatherData(null);
    setWeatherPrompt("");
    setSelectedExercises([]);
    setFitnessLevel("");
    setPrescribedExercises("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex flex-col w-full gap-6 bg-black/90 dark:bg-black/90 backdrop-blur-sm p-4 rounded-xl relative text-white before:absolute before:inset-0 before:p-[2px] before:bg-white before:rounded-xl before:-z-[1] after:absolute after:inset-[2px] after:bg-black/90 after:-z-[1]">
        <div className="absolute inset-[-2px] bg-red-600 rounded-xl -z-[2]" />
        <div className="absolute inset-[-4px] bg-[#C4A052] rounded-xl -z-[3]" />
        
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          renderTooltip={() => (
            <TooltipWrapper content="Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment." />
          )}
        />
        
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
          renderTooltip={() => (
            <TooltipWrapper content="Add specific equipment or exercises you have access to. This helps create workouts that match your available resources." />
          )}
        />

        <FitnessSection
          fitnessLevel={fitnessLevel}
          onFitnessLevelChange={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          onPrescribedExercisesChange={setPrescribedExercises}
          renderTooltip={() => (
            <TooltipWrapper content="Share your fitness level and any prescribed exercises to receive personalized workouts that match your capabilities and requirements." />
          )}
        />

        <DaysSelection
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          renderTooltip={() => (
            <TooltipWrapper content="Select the number of days for your workout program." />
          )}
        />

        <GenerateSection
          onGenerate={handleGenerateWithWeather}
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