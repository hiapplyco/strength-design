
import React from "react";
import { WorkoutCycleSelectors } from "../../WorkoutCycleSelectors";
import { FitnessSection } from "../../FitnessSection";
import { InjuriesSection } from "../../InjuriesSection";
import { ExerciseSection } from "../../ExerciseSection";
import { PrescribedExercisesSection } from "../../PrescribedExercisesSection";
import { WeatherSection } from "../../WeatherSection";
import type { Exercise } from "@/components/exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface InputSectionsProps {
  numberOfCycles: number;
  setNumberOfCycles: (value: number) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
  injuries: string;
  setInjuries: (value: string) => void;
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise, action?: 'add' | 'remove') => void;
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
  isAnalyzingPrescribed: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
  weatherData: WeatherData | null;
  handleWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
}

export function InputSections({
  numberOfCycles,
  setNumberOfCycles,
  numberOfDays,
  setNumberOfDays,
  fitnessLevel,
  setFitnessLevel,
  injuries,
  setInjuries,
  selectedExercises,
  onExerciseSelect,
  prescribedExercises,
  setPrescribedExercises,
  isAnalyzingInjuries,
  handleInjuriesFileSelect,
  isAnalyzingPrescribed,
  handlePrescribedFileSelect,
  weatherData,
  handleWeatherUpdate,
}: InputSectionsProps) {
  return (
    <div className="space-y-5 sm:space-y-6 pb-6 px-2">
      <WorkoutCycleSelectors
        numberOfCycles={numberOfCycles}
        setNumberOfCycles={setNumberOfCycles}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
      />
      
      <FitnessSection 
        fitnessLevel={fitnessLevel}
        onFitnessLevelChange={setFitnessLevel}
        renderTooltip={() => null}
      />
      
      <InjuriesSection 
        injuries={injuries}
        setInjuries={setInjuries}
        isAnalyzingInjuries={isAnalyzingInjuries}
        handleInjuriesFileSelect={handleInjuriesFileSelect}
      />
      
      <ExerciseSection 
        selectedExercises={selectedExercises}
        onExerciseSelect={onExerciseSelect}
        renderTooltip={() => null}
      />
      
      <PrescribedExercisesSection 
        prescribedExercises={prescribedExercises}
        setPrescribedExercises={setPrescribedExercises}
        isAnalyzingPrescribed={isAnalyzingPrescribed}
        handlePrescribedFileSelect={handlePrescribedFileSelect}
      />
      
      <WeatherSection 
        weatherData={weatherData}
        onWeatherUpdate={handleWeatherUpdate}
        renderTooltip={() => null}
        numberOfDays={numberOfDays}
      />
    </div>
  );
}
