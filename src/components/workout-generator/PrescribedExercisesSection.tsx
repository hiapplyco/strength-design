
import { Dumbbell } from "lucide-react";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

export interface PrescribedExercisesSectionProps {
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingPrescribed: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
}

export function PrescribedExercisesSection({
  prescribedExercises,
  setPrescribedExercises,
  isAnalyzingPrescribed,
  handlePrescribedFileSelect
}: PrescribedExercisesSectionProps) {
  return (
    <ExpandableSectionContainer
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      title="What are your Goals?"
      tooltipContent="Share your fitness goals and specific exercises you'd like to include in your workout program."
      textAreaPlaceholder="List any specific exercises you need to include"
      fileUploadTitle="Upload Exercise Program"
      fileAnalysisSteps={["Processing file", "Extracting exercises", "Analyzing content"]}
      content={prescribedExercises}
      setContent={setPrescribedExercises}
      isAnalyzing={isAnalyzingPrescribed}
      handleFileSelect={handlePrescribedFileSelect}
    />
  );
}
