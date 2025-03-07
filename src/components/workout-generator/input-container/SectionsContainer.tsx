
import React from "react";
import { DaysSelectionCard } from "../DaysSelectionCard";
import { FitnessLevelSection } from "../FitnessLevelSection";
import { PrescribedExercisesSection } from "../PrescribedExercisesSection";
import { InjuriesSection } from "../InjuriesSection";
import { WeatherSection } from "../WeatherSection";
import { GenerateSection } from "../GenerateSection";
import type { Exercise } from "../../exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface SectionsContainerProps {
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  injuries: string;
  setInjuries: (value: string) => void;
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  isAnalyzingPrescribed: boolean;
  isAnalyzingInjuries: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
  isGenerating: boolean;
  onGenerate: () => void;
  onClear: () => void;
  selectedExercises: Exercise[];
}

export function SectionsContainer({
  numberOfDays,
  setNumberOfDays,
  fitnessLevel,
  setFitnessLevel,
  prescribedExercises,
  setPrescribedExercises,
  injuries,
  setInjuries,
  weatherData,
  onWeatherUpdate,
  isAnalyzingPrescribed,
  isAnalyzingInjuries,
  handlePrescribedFileSelect,
  handleInjuriesFileSelect,
  isGenerating,
  onGenerate,
  onClear,
  selectedExercises,
}: SectionsContainerProps) {
  return (
    <div className="space-y-5 sm:space-y-6 pb-6 px-2">
      <DaysSelectionCard 
        numberOfDays={numberOfDays} 
        setNumberOfDays={setNumberOfDays} 
      />
      
      <FitnessLevelSection
        fitnessLevel={fitnessLevel}
        setFitnessLevel={setFitnessLevel}
      />
      
      <PrescribedExercisesSection
        prescribedExercises={prescribedExercises}
        setPrescribedExercises={setPrescribedExercises}
        isAnalyzingPrescribed={isAnalyzingPrescribed}
        handlePrescribedFileSelect={handlePrescribedFileSelect}
      />
      
      <InjuriesSection
        injuries={injuries}
        setInjuries={setInjuries}
        isAnalyzingInjuries={isAnalyzingInjuries}
        handleInjuriesFileSelect={handleInjuriesFileSelect}
      />
      
      <WeatherSection
        weatherData={weatherData}
        onWeatherUpdate={onWeatherUpdate}
        renderTooltip={() => null}
        numberOfDays={numberOfDays}
      />
      
      <GenerateSection
        isGenerating={isGenerating}
        onGenerate={onGenerate}
        onClear={onClear}
        isValid={true}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        selectedExercises={selectedExercises}
        fitnessLevel={fitnessLevel}
        prescribedExercises={prescribedExercises}
        injuries={injuries}
        weatherData={weatherData}
      />
    </div>
  );
}
