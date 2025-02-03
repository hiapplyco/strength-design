import { Dumbbell, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";

interface PrescribedExercisesSectionProps {
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
  const handleClear = () => {
    setPrescribedExercises("");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">What are your Goals?</h3>
          <TooltipWrapper content="Share your fitness goals and specific exercises you'd like to include in your workout program." />
        </div>
        {prescribedExercises && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <Textarea
            placeholder="List any specific exercises you need to include"
            value={prescribedExercises}
            onChange={(e) => setPrescribedExercises(e.target.value)}
            className="min-h-[80px] bg-white text-black placeholder:text-gray-400"
          />
        </div>
        <div className="col-span-1">
          <FileUploadSection
            title="Upload Exercise Program"
            isAnalyzing={isAnalyzingPrescribed}
            content={prescribedExercises}
            onFileSelect={handlePrescribedFileSelect}
            analysisSteps={["Processing file", "Extracting exercises", "Analyzing content"]}
          />
        </div>
      </div>
    </div>
  );
}