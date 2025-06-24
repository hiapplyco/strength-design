
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
      icon={Target}
      title="Prescribed Exercises & Goals"
      renderTooltip={renderTooltip}
      fileUploadSection={
        <FileUploadSection
          title="Workout Plans"
          isAnalyzing={isAnalyzingPrescribed}
          isSuccess={false}
          content=""
          onFileSelect={handlePrescribedFileSelect}
          analysisSteps={[
            "Reading workout document...",
            "Extracting exercise information...",
            "Identifying goals and targets...",
            "Processing training plan..."
          ]}
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Enter any specific exercises prescribed by your trainer, physical therapist, or that you want to focus on.
        </p>
        <Textarea
          placeholder="e.g., 3x10 squats, planks for core stability, rotator cuff exercises..."
          value={prescribedExercises}
          onChange={(e) => setPrescribedExercises(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </div>
    </ExpandableSectionContainer>
  );
}
