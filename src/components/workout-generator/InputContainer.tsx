import { ExerciseSearch } from "@/components/ExerciseSearch";
import { FitnessSection } from "./FitnessSection";
import { GoalsAndInjuriesSection } from "./GoalsAndInjuriesSection";
import { WeatherSection } from "./WeatherSection";
import { GenerateSection } from "./GenerateSection";
import { WorkoutPresets } from "./WorkoutPresets";
import { TooltipWrapper } from "./TooltipWrapper";
import type { Exercise } from "@/components/exercise-search/types";
import { useState } from "react";
import type { WeatherData } from "@/types/weather";

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
  showGenerateInput: boolean;
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
  showGenerateInput,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays,
}: InputContainerProps) {
  // State management for the form
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [prescribedExercises, setPrescribedExercises] = useState("");
  const [injuries, setInjuries] = useState("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const handlePresetSelect = (preset: any) => {
    if (preset.prescribedExercises) {
      setGeneratePrompt(preset.prescribedExercises);
    }
  };

  const handleWeatherUpdate = (data: WeatherData | null, prompt: string) => {
    setWeatherData(data);
    setWeatherPrompt(prompt);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const exists = prev.some(e => e.name === exercise.name);
      if (exists) {
        return prev.filter(e => e.name !== exercise.name);
      }
      return [...prev, exercise];
    });
  };

  const handlePrescribedFileSelect = async (file: File) => {
    setIsAnalyzingPrescribed(true);
    // Implementation for file analysis would go here
    setIsAnalyzingPrescribed(false);
  };

  const handleInjuriesFileSelect = async (file: File) => {
    setIsAnalyzingInjuries(true);
    // Implementation for file analysis would go here
    setIsAnalyzingInjuries(false);
  };

  const renderTooltip = (content: string) => (
    <TooltipWrapper content={content} />
  );

  const handleGenerate = () => {
    if (fitnessLevel && numberOfDays > 0) {
      handleGenerateWorkout({
        prompt: generatePrompt,
        weatherPrompt,
        selectedExercises,
        fitnessLevel,
        prescribedExercises
      });
    }
  };

  const handleClear = () => {
    setPrescribedExercises("");
    setInjuries("");
    setFitnessLevel("");
    setWeatherData(null);
    setWeatherPrompt("");
    setSelectedExercises([]);
  };

  return (
    <div className="space-y-8">
      <WorkoutPresets onSelectPreset={handlePresetSelect} />
      <WeatherSection
        weatherData={weatherData}
        onWeatherUpdate={handleWeatherUpdate}
        renderTooltip={() => renderTooltip("Add your location for weather-optimized workouts")}
      />
      <ExerciseSearch 
        onExerciseSelect={handleExerciseSelect}
        selectedExercises={selectedExercises}
      />
      <FitnessSection
        fitnessLevel={fitnessLevel}
        onFitnessLevelChange={setFitnessLevel}
        prescribedExercises={prescribedExercises}
        onPrescribedExercisesChange={setPrescribedExercises}
        injuries={injuries}
        onInjuriesChange={setInjuries}
        renderTooltip={() => renderTooltip("Select your fitness level and any specific requirements")}
      />
      <GoalsAndInjuriesSection
        prescribedExercises={prescribedExercises}
        setPrescribedExercises={setPrescribedExercises}
        isAnalyzingPrescribed={isAnalyzingPrescribed}
        handlePrescribedFileSelect={handlePrescribedFileSelect}
        injuries={injuries}
        setInjuries={setInjuries}
        isAnalyzingInjuries={isAnalyzingInjuries}
        handleInjuriesFileSelect={handleInjuriesFileSelect}
      />
      <GenerateSection
        onGenerate={handleGenerate}
        onClear={handleClear}
        isGenerating={isGenerating}
        renderTooltip={() => renderTooltip("Generate your custom workout program")}
        isValid={fitnessLevel !== "" && numberOfDays > 0}
        selectedExercises={selectedExercises}
        fitnessLevel={fitnessLevel}
        prescribedExercises={prescribedExercises}
        injuries={injuries}
        numberOfDays={numberOfDays}
        weatherData={weatherData}
      />
    </div>
  );
}