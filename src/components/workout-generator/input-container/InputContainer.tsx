
import React, { useState } from "react";
import { DaysSelectionCard } from "../DaysSelectionCard";
import { FitnessSection } from "../FitnessSection";
import { InjuriesSection } from "../InjuriesSection";
import { ExerciseSection } from "../ExerciseSection";
import { PrescribedExercisesSection } from "../PrescribedExercisesSection";
import { WeatherSection } from "../WeatherSection";
import { FileUploadSection } from "../FileUploadSection";
import { GenerateSection } from "../GenerateSection";
import { useWorkoutInputState } from "../hooks/useWorkoutInputState";
import type { Exercise } from "@/components/exercise-search/types";
import { Card } from "@/components/ui/card";
import { PresetsSection } from "../input-sections/PresetsSection";
import { motion } from "framer-motion";
import { SectionsContainer } from "./SectionsContainer";
import { FileHandlers } from "./FileHandlers";
import { PresetHandler } from "./PresetHandler";

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
    weatherData, setWeatherData,
  } = useWorkoutInputState();

  // File handling state
  const [fileContent, setFileContent] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate workout handler
  const onGenerate = async () => {
    await handleGenerateWorkout({
      prompt: props.generatePrompt,
      weatherPrompt: weatherData?.summary || "",
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
    setWeatherData(null);
    setFileContent("");
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

  // Props for file handling components
  const fileHandlerProps = {
    setFileContent,
    isAnalyzing, 
    setIsAnalyzing,
    prescribedExercises,
    setPrescribedExercises
  };

  // Props for preset handling component
  const presetHandlerProps = {
    handleSelectPreset,
    selectedExercises,
    prescribedExercises
  };

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
      <SectionsContainer>
        <DaysSelectionCard
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
        />
        
        <FitnessSection 
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
        />
        
        <InjuriesSection 
          injuries={injuries}
          setInjuries={setInjuries}
        />
        
        <ExerciseSection 
          selectedExercises={selectedExercises}
          setSelectedExercises={setSelectedExercises}
        />
        
        <PrescribedExercisesSection 
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
        />
        
        <WeatherSection 
          weatherData={weatherData}
          setWeatherData={setWeatherData}
        />

        <FileHandlers {...fileHandlerProps} />
      </SectionsContainer>

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
