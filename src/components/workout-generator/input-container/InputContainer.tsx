
import React from "react";
import { ExerciseSection } from "../ExerciseSection";
import { FitnessSection } from "../FitnessSection";
import { InjuriesSection } from "../InjuriesSection";
import { PrescribedExercisesSection } from "../PrescribedExercisesSection";
import { WeatherSection } from "../WeatherSection";
import { GenerateSection } from "../GenerateSection";
import { WorkoutCycleSelectors } from "../WorkoutCycleSelectors";
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

  // Generate workout handler
  const onGenerate = async () => {
    await handleGenerateWorkout({
      prompt: generatePrompt,
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

  // Enhanced exercise selection handler that properly handles add vs remove
  const handleExerciseSelection = (exercise: Exercise, action?: 'add' | 'remove') => {
    console.log('InputContainer handleExerciseSelection:', exercise.name, 'action:', action);
    
    const isSelected = selectedExercises.some(e => e.id === exercise.id);
    
    if (action === 'add' && !isSelected) {
      // Always add if explicitly told to add and not already selected
      console.log('Adding exercise to selection:', exercise.name);
      setSelectedExercises([...selectedExercises, exercise]);
    } else if (action === 'remove' && isSelected) {
      // Always remove if explicitly told to remove and currently selected
      console.log('Removing exercise from selection:', exercise.name);
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else if (!action) {
      // Toggle behavior when no action specified (for backwards compatibility)
      if (isSelected) {
        console.log('Toggling off exercise:', exercise.name);
        setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
      } else {
        console.log('Toggling on exercise:', exercise.name);
        setSelectedExercises([...selectedExercises, exercise]);
      }
    }
  };

  // NEW: Handle bulk exercise selection
  const handleBulkExerciseSelection = (exercises: Exercise[]) => {
    console.log('InputContainer handleBulkExerciseSelection:', exercises.length, 'exercises');
    
    // Filter out exercises that are already selected to avoid duplicates
    const newExercises = exercises.filter(exercise => 
      !selectedExercises.some(selected => selected.id === exercise.id)
    );
    
    console.log('InputContainer: Adding', newExercises.length, 'new exercises');
    if (newExercises.length > 0) {
      setSelectedExercises(prev => {
        const updated = [...prev, ...newExercises];
        console.log('InputContainer: Updated exercise count:', updated.length);
        return updated;
      });
    }
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
      <PresetsSection 
        onSelectPreset={handleSelectPreset}
        currentPrescribedExercises={prescribedExercises}
      />

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
          onExerciseSelect={handleExerciseSelection}
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
