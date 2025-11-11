
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import { FileUploadSection } from "./FileUploadSection";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface PrescribedExercisesSectionProps {
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingPrescribed: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
  renderTooltip?: () => React.ReactNode;
}

export function PrescribedExercisesSection({ 
  prescribedExercises, 
  setPrescribedExercises, 
  isAnalyzingPrescribed, 
  handlePrescribedFileSelect,
  renderTooltip 
}: PrescribedExercisesSectionProps) {
  return (
    <ExpandableSectionContainer
      icon={<Target className="h-5 w-5" />}
      title="Prescribed Exercises & Goals"
      tooltipContent="Enter any specific exercises prescribed by your trainer, physical therapist, or that you want to focus on."
      textAreaPlaceholder="e.g., 3x10 squats, planks for core stability, rotator cuff exercises..."
      fileUploadTitle="Workout Plans"
      fileAnalysisSteps={[
        "Reading workout document...",
        "Extracting exercise information...",
        "Identifying goals and targets...",
        "Processing training plan..."
      ]}
      content={prescribedExercises}
      setContent={setPrescribedExercises}
      isAnalyzing={isAnalyzingPrescribed}
      handleFileSelect={handlePrescribedFileSelect}
    />
  );
}
