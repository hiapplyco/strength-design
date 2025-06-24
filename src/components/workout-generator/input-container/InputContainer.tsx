
import React from "react";
import { motion } from "framer-motion";
import { GenerateSection } from "../GenerateSection";
import { useWorkoutInputState } from "../hooks/useWorkoutInputState";
import { useGeminiExerciseExtraction } from "../hooks/useGeminiExerciseExtraction";
import { useFileHandlers } from "./FileHandlers";
import { useExerciseSelection } from "./hooks/useExerciseSelection";
import { useWorkoutFormHandlers } from "./hooks/useWorkoutFormHandlers";
import { InputSections } from "./components/InputSections";
import { PresetsSection } from "../input-sections/PresetsSection";
import type { Exercise } from "@/components/exercise-search/types";

interface InputContainerProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
    injuries?: string;
  }) => Promise<void>;
  isGenerating: boolean;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  numberOfCycles: number;
  setNumberOfCycles: (value: number) => void;
  showGenerateInput?: boolean;
  setShowGenerateInput?: (value: boolean) => void;
}

export function InputContainer({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  numberOfDays,
  setNumberOfDays,
  numberOfCycles,
  setNumberOfCycles,
}: InputContainerProps) {
  // State management for input values
  const {
    fitnessLevel, setFitnessLevel,
    injuries, setInjuries,
    selectedExercises, setSelectedExercises,
    prescribedExercises, setPrescribedExercises,
    weatherData, weatherPrompt,
    isAnalyzingPrescribed, 
    isAnalyzingInjuries,
    handleFileProcessing,
    handleWeatherUpdate
  } = useWorkoutInputState();

  // Set up document parsing
  const { parseDocument } = useGeminiExerciseExtraction();

  // Set up file handlers
  const fileHandlingProps = {
    handleFileProcessing,
    parseDocument
  };
  
  const { handlePrescribedFileSelect, handleInjuriesFileSelect } = useFileHandlers(fileHandlingProps);

  // Exercise selection handlers
  const { handleExerciseSelection, handleBulkExerciseSelection } = useExerciseSelection({
    selectedExercises,
    setSelectedExercises,
  });

  // Workout form handlers
  const { onGenerate, onClear, handleSelectPreset } = useWorkoutFormHandlers({
    handleGenerateWorkout,
    generatePrompt,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    setFitnessLevel,
    setInjuries,
    setSelectedExercises,
    setPrescribedExercises,
    handleWeatherUpdate,
    setNumberOfDays,
  });

  // Determine form validity
  const isFormValid = fitnessLevel.trim() !== "" || selectedExercises.length > 0 || prescribedExercises.trim() !== "";

  return (
    <motion.div 
      className="space-y-6 w-full py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PresetsSection 
        onSelectPreset={handleSelectPreset}
        currentPrescribedExercises={prescribedExercises}
      />

      <InputSections
        numberOfCycles={numberOfCycles}
        setNumberOfCycles={setNumberOfCycles}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        fitnessLevel={fitnessLevel}
        setFitnessLevel={setFitnessLevel}
        injuries={injuries}
        setInjuries={setInjuries}
        selectedExercises={selectedExercises}
        onExerciseSelect={handleExerciseSelection}
        prescribedExercises={prescribedExercises}
        setPrescribedExercises={setPrescribedExercises}
        isAnalyzingInjuries={isAnalyzingInjuries}
        handleInjuriesFileSelect={handleInjuriesFileSelect}
        isAnalyzingPrescribed={isAnalyzingPrescribed}
        handlePrescribedFileSelect={handlePrescribedFileSelect}
        weatherData={weatherData}
        handleWeatherUpdate={handleWeatherUpdate}
      />

      <GenerateSection
        onGenerate={onGenerate}
        onClear={onClear}
        isGenerating={isGenerating}
        isValid={isFormValid}
        numberOfDays={numberOfDays}
        numberOfCycles={numberOfCycles}
        selectedExercises={selectedExercises}
        fitnessLevel={fitnessLevel}
        prescribedExercises={prescribedExercises}
        injuries={injuries}
        weatherData={weatherData}
      />
    </motion.div>
  );
}
