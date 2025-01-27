import { WeatherSection } from "./WeatherSection";
import { ExerciseSection } from "./ExerciseSection";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { PrescribedExercisesSection } from "./PrescribedExercisesSection";
import { InjuriesSection } from "./InjuriesSection";
import { GenerateSection } from "./GenerateSection";
import { DaysSelection } from "./DaysSelection";
import { WorkoutPresets } from "./WorkoutPresets";
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

const RequiredLabel = () => (
  <span className="text-red-500 ml-1">*</span>
);

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
      <WorkoutPresets 
        onSelectPreset={(preset) => {
          setPrescribedExercises(preset.prescribedExercises);
          setFitnessLevel(preset.fitnessLevel);
          setNumberOfDays(preset.numberOfDays);
        }} 
      />

      <WeatherSection 
        weatherData={weatherData}
        onWeatherUpdate={onWeatherUpdate}
        renderTooltip={() => (
          <div className="tooltip">Add your location to get weather-optimized workouts</div>
        )}
      />
      
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Search Exercises & Equipment<RequiredLabel /></h3>
        </div>
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={onExerciseSelect}
          renderTooltip={() => (
            <div className="tooltip">Select exercises and equipment you have access to</div>
          )}
        />
      </div>

      <FitnessLevelSection
        fitnessLevel={fitnessLevel}
        setFitnessLevel={setFitnessLevel}
        isRequired={true}
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
        isRequired={true}
        renderTooltip={() => (
          <div className="tooltip">Choose how many days you want to train</div>
        )}
      />

      <GenerateSection
        onGenerate={onGenerate}
        onClear={onClear}
        isGenerating={isGenerating}
        isValid={isValid}
        renderTooltip={() => (
          <div className="tooltip">Review your selections and generate your program</div>
        )}
      />
    </div>
  );
}