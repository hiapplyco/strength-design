
import { useWorkoutInputState } from "../../hooks/useWorkoutInputState";
import { useGeminiExerciseExtraction } from "../../hooks/useGeminiExerciseExtraction";
import { useFileHandlers } from "../FileHandlers";

export function useInputContainerState() {
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

  return {
    // State values
    fitnessLevel,
    setFitnessLevel,
    injuries,
    setInjuries,
    selectedExercises,
    setSelectedExercises,
    prescribedExercises,
    setPrescribedExercises,
    weatherData,
    weatherPrompt,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    
    // Handlers
    handleWeatherUpdate,
    handlePrescribedFileSelect,
    handleInjuriesFileSelect,
  };
}
