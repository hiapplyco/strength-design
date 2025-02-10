
import { WorkoutPresets } from "./WorkoutPresets";
import { WeatherSection } from "./WeatherSection";
import { ExerciseSection } from "./ExerciseSection";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { GoalsAndInjuriesSection } from "./GoalsAndInjuriesSection";
import { GenerateSection } from "./GenerateSection";
import { DaysSelection } from "./DaysSelection";
import { TooltipWrapper } from "./TooltipWrapper";
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
  const renderTooltip = (content: string) => (
    <TooltipWrapper content={content} />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-jupyter-cell/70 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(196,160,82,0.1)] p-8 border border-jupyter-border">
      <div className="prose prose-lg mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Workout Program Generator</h1>
        <p className="text-gray-300">Build your custom workout program by filling out the sections below.</p>
      </div>

      <div className="space-y-6">
        <WorkoutPresets 
          onSelectPreset={(preset) => {
            setPrescribedExercises(preset.prescribedExercises);
            setFitnessLevel(preset.fitnessLevel);
            setNumberOfDays(preset.numberOfDays);
          }}
        />

        <div className="jupyter-cell">
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
        </div>

        <div className="jupyter-cell">
          <WeatherSection 
            weatherData={weatherData}
            onWeatherUpdate={onWeatherUpdate}
            renderTooltip={() => renderTooltip("Add your location to get weather-optimized workouts")}
          />
        </div>
        
        <div className="jupyter-cell">
          <ExerciseSection
            selectedExercises={selectedExercises}
            onExerciseSelect={onExerciseSelect}
            renderTooltip={() => renderTooltip("Select specific exercises and equipment you have access to")}
          />
        </div>

        <div className="jupyter-cell">
          <FitnessLevelSection
            fitnessLevel={fitnessLevel}
            setFitnessLevel={setFitnessLevel}
          />
        </div>

        <div className="jupyter-cell">
          <DaysSelection
            numberOfDays={numberOfDays}
            setNumberOfDays={setNumberOfDays}
            renderTooltip={renderTooltip}
          />
        </div>

        <div className="jupyter-cell">
          <GenerateSection
            onGenerate={onGenerate}
            onClear={onClear}
            isGenerating={isGenerating}
            renderTooltip={() => renderTooltip("Review your selections and generate your program")}
            isValid={isValid}
            selectedExercises={selectedExercises}
            fitnessLevel={fitnessLevel}
            prescribedExercises={prescribedExercises}
            injuries={injuries}
            numberOfDays={numberOfDays}
            weatherData={weatherData}
          />
        </div>
      </div>
    </div>
  );
}
