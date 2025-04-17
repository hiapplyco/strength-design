import React from "react";
import { WorkoutPresets } from "./WorkoutPresets";
import { WeatherSection } from "./WeatherSection";
import { ExerciseSection } from "./ExerciseSection";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { GoalsAndInjuriesSection } from "./GoalsAndInjuriesSection";
import { GenerateSection } from "./GenerateSection";
import { TooltipWrapper } from "./TooltipWrapper";
import type { Exercise } from "../exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface WorkoutGeneratorFormProps {
  // Weather-related props
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  
  // Exercise-related props
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  
  // Fitness level props
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
  
  // Prescribed exercises props
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingPrescribed: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
  
  // Injuries/limitations props
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
  
  // Training schedule props
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  
  // Form action props
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  isValid: boolean;
}

export function WorkoutGeneratorForm({
  // Weather-related props
  weatherData,
  onWeatherUpdate,
  
  // Exercise-related props
  selectedExercises,
  onExerciseSelect,
  
  // Fitness level props
  fitnessLevel,
  setFitnessLevel,
  
  // Prescribed exercises props
  prescribedExercises,
  setPrescribedExercises,
  isAnalyzingPrescribed,
  handlePrescribedFileSelect,
  
  // Injuries/limitations props
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect,
  
  // Training schedule props
  numberOfDays,
  setNumberOfDays,
  
  // Form action props
  onGenerate,
  onClear,
  isGenerating,
  isValid
}: WorkoutGeneratorFormProps) {
  // Tooltip generator function to create tooltips with consistent styling
  const renderTooltip = (content: string) => (
    <TooltipWrapper content={content} />
  );

  // Handler for preset selection
  const handlePresetSelect = (preset: { prescribedExercises: string; fitnessLevel: string; numberOfDays: number }) => {
    setPrescribedExercises(preset.prescribedExercises);
    setFitnessLevel(preset.fitnessLevel);
    setNumberOfDays(preset.numberOfDays);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-black/20 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(196,160,82,0.1)] p-8 border border-green-500/30">
      {/* Header */}
      <header className="prose prose-lg mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Workout Program Generator</h1>
        <p className="text-gray-300">Build your custom workout program by filling out the sections below.</p>
      </header>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Presets Section */}
        <section>
          <WorkoutPresets onSelectPreset={handlePresetSelect} />
        </section>

        {/* Goals and Injuries Section */}
        <section className="jupyter-cell">
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
        </section>

        {/* Weather Section */}
        <section className="jupyter-cell">
          <WeatherSection 
            weatherData={weatherData}
            onWeatherUpdate={onWeatherUpdate}
            renderTooltip={() => renderTooltip("Add your location to get weather-optimized workouts")}
          />
        </section>
        
        {/* Exercise Selection Section */}
        <section className="jupyter-cell">
          <ExerciseSection
            selectedExercises={selectedExercises}
            onExerciseSelect={onExerciseSelect}
            renderTooltip={() => renderTooltip("Select specific exercises and equipment you have access to")}
          />
        </section>

        {/* Fitness Level Section */}
        <section className="jupyter-cell">
          <FitnessLevelSection
            fitnessLevel={fitnessLevel}
            setFitnessLevel={setFitnessLevel}
          />
        </section>

        {/* Generation Section */}
        <section className="jupyter-cell">
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
            setNumberOfDays={setNumberOfDays}
            weatherData={weatherData}
          />
        </section>
      </div>
    </div>
  );
}
