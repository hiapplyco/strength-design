
import { useCallback } from "react";
import { PresetHandler } from "./PresetHandler";
import { SectionsContainer } from "./SectionsContainer";
import { useFileHandlers } from "./FileHandlers";
import { useWorkoutGeneration } from "./useWorkoutGeneration";
import { useGeminiExerciseExtraction } from "../hooks/useGeminiExerciseExtraction";
import { useWorkoutInputState } from "../hooks/useWorkoutInputState";

interface InputContainerProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: any) => Promise<void>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  showGenerateInput: boolean;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function InputContainer({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  numberOfDays,
  setNumberOfDays,
}: InputContainerProps) {
  const {
    selectedExercises,
    setSelectedExercises,
    fitnessLevel,
    setFitnessLevel,
    prescribedExercises,
    setPrescribedExercises,
    injuries,
    setInjuries,
    weatherData,
    weatherPrompt,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    handleWeatherUpdate,
    handleFileProcessing,
    clearInputs
  } = useWorkoutInputState();

  const { parseDocument } = useGeminiExerciseExtraction();
  
  const { handlePrescribedFileSelect, handleInjuriesFileSelect } = useFileHandlers({
    handleFileProcessing,
    parseDocument
  });

  const handleSelectPreset = useCallback(
    (preset: {
      title: string;
      prescribedExercises: string;
      fitnessLevel: string;
      numberOfDays: number;
    }) => {
      setPrescribedExercises(preset.prescribedExercises);
      setFitnessLevel(preset.fitnessLevel);
      setNumberOfDays(preset.numberOfDays);
      setGeneratePrompt(preset.title);
    },
    [setNumberOfDays, setGeneratePrompt, setPrescribedExercises, setFitnessLevel]
  );

  const { handleSubmit } = useWorkoutGeneration({
    setIsGenerating,
    handleGenerateWorkout,
    generatePrompt,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    numberOfDays
  });

  return (
    <div className="w-full mx-auto max-w-full px-0 sm:px-2">
      <div className="space-y-5 sm:space-y-6 pb-6 px-2">
        <PresetHandler 
          onSelectPreset={handleSelectPreset}
          setSelectedExercises={setSelectedExercises}
          currentPrescribedExercises={prescribedExercises}
        />
        
        <SectionsContainer 
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
          injuries={injuries}
          setInjuries={setInjuries}
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          isAnalyzingPrescribed={isAnalyzingPrescribed}
          isAnalyzingInjuries={isAnalyzingInjuries}
          handlePrescribedFileSelect={handlePrescribedFileSelect}
          handleInjuriesFileSelect={handleInjuriesFileSelect}
          isGenerating={isGenerating}
          onGenerate={handleSubmit}
          onClear={clearInputs}
          selectedExercises={selectedExercises}
        />
      </div>
    </div>
  );
}
