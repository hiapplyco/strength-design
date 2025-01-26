import { WeatherSection } from "./WeatherSection";
import { ExerciseSection } from "./ExerciseSection";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { PrescribedExercisesSection } from "./PrescribedExercisesSection";
import { InjuriesSection } from "./InjuriesSection";
import { GenerateSection } from "./GenerateSection";
import { DaysSelection } from "./DaysSelection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Dumbbell } from "lucide-react";
import type { Exercise } from "../exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface WorkoutGeneratorFormProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingPrescribed: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  isValid: boolean;
}

export function WorkoutGeneratorForm({
  weatherData,
  onWeatherUpdate,
  selectedExercises,
  onExerciseSelect,
  fitnessLevel,
  setFitnessLevel,
  prescribedExercises,
  setPrescribedExercises,
  isAnalyzingPrescribed,
  handlePrescribedFileSelect,
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect,
  numberOfDays,
  setNumberOfDays,
  onGenerate,
  onClear,
  isGenerating,
  isValid
}: WorkoutGeneratorFormProps) {
  return (
    <div className={`relative bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 p-8 space-y-8 ${isGenerating ? 'before:absolute before:inset-0 before:rounded-lg before:border-4 before:border-primary before:animate-[gradient_3s_ease_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent' : ''}`}>
      <WeatherSection 
        weatherData={weatherData}
        onWeatherUpdate={onWeatherUpdate}
        renderTooltip={() => (
          <TooltipWrapper content="Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment." />
        )}
      />
      
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Search Exercises & Equipment</h3>
          <TooltipWrapper content="Add specific equipment or exercises you have access to. This helps create workouts that match your available resources." />
        </div>
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={onExerciseSelect}
          renderTooltip={() => (
            <TooltipWrapper content="Add specific equipment or exercises you have access to. This helps create workouts that match your available resources." />
          )}
        />
      </div>

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

      <DaysSelection
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        renderTooltip={() => (
          <TooltipWrapper content="Select the number of days for your workout program." />
        )}
      />

      <GenerateSection
        onGenerate={onGenerate}
        onClear={onClear}
        isGenerating={isGenerating}
        isValid={isValid}
        renderTooltip={() => (
          <TooltipWrapper content="Review your selections and generate a custom workout program tailored to your needs." />
        )}
      />
    </div>
  );
}