
import { FitnessSection } from "./FitnessSection";
import { GoalsAndInjuriesSection } from "./GoalsAndInjuriesSection";
import { WeatherSection } from "./WeatherSection";
import { GenerateSection } from "./GenerateSection";
import { WorkoutPresets } from "./WorkoutPresets";
import { TooltipWrapper } from "./TooltipWrapper";
import type { WeatherData } from "@/types/weather";
import { useState } from "react";

interface InputContainerProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [prescribedExercises, setPrescribedExercises] = useState("");
  const [injuries, setInjuries] = useState("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);

  const handlePresetSelect = (preset: any) => {
    if (preset.prescribedExercises) {
      setGeneratePrompt(preset.prescribedExercises);
      setFitnessLevel(preset.fitnessLevel);
      setNumberOfDays(preset.numberOfDays);
      setPrescribedExercises(preset.prescribedExercises);
    }
  };

  const handleWeatherUpdate = (data: WeatherData | null, prompt: string) => {
    setWeatherData(data);
    setWeatherPrompt(prompt);
  };

  const handleGenerate = () => {
    if (fitnessLevel && numberOfDays > 0) {
      handleGenerateWorkout({
        prompt: generatePrompt,
        weatherPrompt,
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
  };

  const renderTooltip = (content: string) => (
    <TooltipWrapper content={content} />
  );

  const handlePrescribedFileSelect = async (file: File) => {
    setIsAnalyzingPrescribed(true);
    try {
      // Implementation for file analysis would go here
      console.log("Analyzing prescribed exercises file:", file.name);
    } finally {
      setIsAnalyzingPrescribed(false);
    }
  };

  const handleInjuriesFileSelect = async (file: File) => {
    setIsAnalyzingInjuries(true);
    try {
      // Implementation for file analysis would go here
      console.log("Analyzing injuries file:", file.name);
    } finally {
      setIsAnalyzingInjuries(false);
    }
  };

  return (
    <div className="space-y-8">
      <WorkoutPresets 
        onSelectPreset={handlePresetSelect}
      />
      <WeatherSection
        weatherData={weatherData}
        onWeatherUpdate={handleWeatherUpdate}
        renderTooltip={() => renderTooltip("Add your location for weather-optimized workouts")}
      />
      <FitnessSection
        fitnessLevel={fitnessLevel}
        onFitnessLevelChange={setFitnessLevel}
        renderTooltip={() => renderTooltip("Select your fitness level")}
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
        fitnessLevel={fitnessLevel}
        prescribedExercises={prescribedExercises}
        injuries={injuries}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        weatherData={weatherData}
      />
    </div>
  );
}
