
import { Dumbbell, HeartPulse } from "lucide-react";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface GoalsAndInjuriesSectionProps {
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingPrescribed?: boolean;
  handlePrescribedFileSelect?: (file: File) => Promise<void>;
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries?: boolean;
  handleInjuriesFileSelect?: (file: File) => Promise<void>;
}

export function GoalsAndInjuriesSection({
  prescribedExercises,
  setPrescribedExercises,
  isAnalyzingPrescribed = false,
  handlePrescribedFileSelect = async () => {},
  injuries,
  setInjuries,
  isAnalyzingInjuries = false,
  handleInjuriesFileSelect = async () => {},
}: GoalsAndInjuriesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <ExpandableSectionContainer
        icon={<Dumbbell className="h-5 w-5 text-primary" />}
        title="What are your fitness goals?"
        tooltipContent="Tell us about your fitness goals to help AI personalize your workout plan"
        textAreaPlaceholder="List any specific exercises you need to include"
        fileUploadTitle="Upload Exercise Program"
        fileAnalysisSteps={["Processing file", "Extracting exercises", "Analyzing content"]}
        content={prescribedExercises}
        setContent={setPrescribedExercises}
        isAnalyzing={isAnalyzingPrescribed}
        handleFileSelect={handlePrescribedFileSelect}
        initialExpanded={false}
      />
      
      <ExpandableSectionContainer
        icon={<HeartPulse className="h-5 w-5 text-primary" />}
        title="Any injuries or health considerations?"
        tooltipContent="List any injuries or health conditions that your workout should accommodate"
        textAreaPlaceholder="List any injuries or health conditions"
        fileUploadTitle="Upload Medical Information"
        fileAnalysisSteps={["Processing file", "Extracting information", "Analyzing content"]}
        content={injuries}
        setContent={setInjuries}
        isAnalyzing={isAnalyzingInjuries}
        handleFileSelect={handleInjuriesFileSelect}
        initialExpanded={false}
      />
    </div>
  );
}
