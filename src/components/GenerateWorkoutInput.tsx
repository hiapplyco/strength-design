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

    const exercisesPrompt = selectedExercises.length > 0 
      ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
      : "";
    
    const fitnessPrompt = fitnessLevel 
      ? ` Consider this fitness profile: ${fitnessLevel}.`
      : "";

    const prescribedPrompt = prescribedExercises
      ? ` Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.`
      : "";
    
    const fullPrompt = `${weatherPrompt}${exercisesPrompt}${fitnessPrompt}${prescribedPrompt}`;
    console.log("Generating workout with prompt:", fullPrompt);
    setGeneratePrompt(fullPrompt);

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

  const renderTooltip = (content: string) => (
    <TooltipWrapper content={content} />
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col w-full gap-6 bg-black/90 dark:bg-black/90 backdrop-blur-sm p-6 rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] transform hover:scale-[0.99] transition-all duration-200 text-white">
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          renderTooltip={() => renderTooltip(
            "Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment."
          )}
        />
        
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
          renderTooltip={() => renderTooltip(
            "Add specific equipment or exercises you have access to. This helps create workouts that match your available resources."
          )}
        />

        <FitnessSection
          fitnessLevel={fitnessLevel}
          onFitnessLevelChange={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          onPrescribedExercisesChange={setPrescribedExercises}
          renderTooltip={() => renderTooltip(
            "Share your fitness level and any prescribed exercises to receive personalized workouts that match your capabilities and requirements."
          )}
        />

        <DaysSelection
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          renderTooltip={renderTooltip}
        />

        <GenerateSection
          onGenerate={handleGenerateWithWeather}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={isValid}
          renderTooltip={() => renderTooltip(
            "Review your selections and generate a custom workout program tailored to your needs."
          )}
        />
      </div>
    </div>
  );
}