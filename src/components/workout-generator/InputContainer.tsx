import { motion, AnimatePresence } from "framer-motion";
import { WorkoutGeneratorForm } from "./WorkoutGeneratorForm";
import { useWorkoutGeneration } from "./hooks/useWorkoutGeneration";
import type { Exercise } from "../exercise-search/types";

interface InputContainerProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => Promise<void>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
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
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays
}: InputContainerProps) {
  const {
    weatherData,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    handleWeatherUpdate,
    handleExerciseSelect,
    handlePrescribedFileSelect,
    handleInjuriesFileSelect,
    handleGenerateWithWeather,
    handleClear,
    setFitnessLevel,
    setPrescribedExercises,
    setInjuries
  } = useWorkoutGeneration({
    handleGenerateWorkout,
    setIsGenerating,
    setGeneratePrompt
  });

  const startGenerating = () => {
    setIsGenerating(true);
    requestAnimationFrame(() => {
      handleGenerateWithWeather(numberOfDays);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl mx-auto px-4"
      >
        <WorkoutGeneratorForm
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
          isAnalyzingPrescribed={isAnalyzingPrescribed}
          handlePrescribedFileSelect={handlePrescribedFileSelect}
          injuries={injuries}
          setInjuries={setInjuries}
          isAnalyzingInjuries={isAnalyzingInjuries}
          handleInjuriesFileSelect={handleInjuriesFileSelect}
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          onGenerate={startGenerating}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={fitnessLevel !== "" && numberOfDays > 0}
        />
      </motion.div>
    </AnimatePresence>
  );
}