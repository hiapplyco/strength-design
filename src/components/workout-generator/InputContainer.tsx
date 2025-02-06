import { ExerciseSearch } from "@/components/ExerciseSearch";
import { FitnessSection } from "./FitnessSection";
import { GoalsAndInjuriesSection } from "./GoalsAndInjuriesSection";
import { WeatherSection } from "./WeatherSection";
import { GenerateSection } from "./GenerateSection";
import { WorkoutPresets } from "./WorkoutPresets";
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
  }) => Promise<void>;
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
  showGenerateInput,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays,
}: InputContainerProps) {
  const handlePresetSelect = (preset: any) => {
    if (preset.prescribedExercises) {
      setGeneratePrompt(preset.prescribedExercises);
    }
  };

  return (
    <div className="space-y-8">
      <WorkoutPresets onSelectPreset={handlePresetSelect} />
      <WeatherSection />
      <ExerciseSearch />
      <FitnessSection />
      <GoalsAndInjuriesSection />
      <GenerateSection
        generatePrompt={generatePrompt}
        setGeneratePrompt={setGeneratePrompt}
        handleGenerateWorkout={handleGenerateWorkout}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
      />
    </div>
  );
}