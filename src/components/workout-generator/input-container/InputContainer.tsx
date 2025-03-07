
import React from "react";
import { DaysSelectionCard } from "../DaysSelectionCard";
import { FitnessSection } from "../FitnessSection";
import { InjuriesSection } from "../InjuriesSection";
import { ExerciseSection } from "../ExerciseSection";
import { PrescribedExercisesSection } from "../PrescribedExercisesSection";
import { WeatherSection } from "../WeatherSection";
import { GenerateSection } from "../GenerateSection";
import { useWorkoutInputState } from "../hooks/useWorkoutInputState";
import type { Exercise } from "@/components/exercise-search/types";
import { PresetsSection } from "../input-sections/PresetsSection";
import { motion } from "framer-motion";
import { useFileHandlers } from "./FileHandlers";
import { useGeminiExerciseExtraction } from "../hooks/useGeminiExerciseExtraction";

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
  showGenerateInput?: boolean;
  setShowGenerateInput?: (value: boolean) => void;
}

export function InputContainer(props: InputContainerProps) {
  const { 
    handleGenerateWorkout, 
    isGenerating, 
    numberOfDays, 
    setNumberOfDays 
  } = props;

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

  // Generate workout handler
  const onGenerate = async () => {
    await handleGenerateWorkout({
      prompt: props.generatePrompt,
      weatherPrompt: weatherPrompt || "",
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries: injuries || undefined,
    });
  };

  // Reset form handler
  const onClear = () => {
    setFitnessLevel("");
    setInjuries("");
    setSelectedExercises([]);
    setPrescribedExercises("");
    handleWeatherUpdate(null, "");
  };

  // Handler for preset selection
  const handleSelectPreset = (preset: { 
    title: string; 
    prescribedExercises: string; 
    fitnessLevel: string;
    numberOfDays: number;
  }) => {
    setPrescribedExercises(preset.prescribedExercises);
    setFitnessLevel(preset.fitnessLevel);
    setNumberOfDays(preset.numberOfDays);
  };

  // Determine form validity
  const isFormValid = fitnessLevel.trim() !== "" || selectedExercises.length > 0 || prescribedExercises.trim() !== "";

  return (
    <motion.div 
      className="space-y-6 w-full py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Presets Section */}
      <PresetsSection 
        onSelectPreset={handleSelectPreset}
        currentPrescribedExercises={prescribedExercises}
      />

      {/* Main Form Sections */}
      <div className="space-y-5 sm:space-y-6 pb-6 px-2">
        <DaysSelectionCard
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
          onExerciseSelect={(exercise) => {
            // Toggle exercise selection
            const isSelected = selectedExercises.some(e => e.id === exercise.id);
            if (isSelected) {
              setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
            } else {
              setSelectedExercises([...selectedExercises, exercise]);
            }
          }}
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

      {/* Generate Button Section */}
      <GenerateSection
        onGenerate={onGenerate}
        onClear={onClear}
        isGenerating={isGenerating}
        isValid={isFormValid}
        numberOfDays={numberOfDays}
        selectedExercises={selectedExercises}
        fitnessLevel={fitnessLevel}
        prescribedExercises={prescribedExercises}
        injuries={injuries}
        weatherData={weatherData}
      />
    </motion.div>
  );
}
