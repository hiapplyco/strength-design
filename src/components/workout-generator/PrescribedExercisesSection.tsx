import { Dumbbell } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";

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
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Prescribed Exercises</h3>
        <TooltipWrapper content="Add any specific exercises you need to include in your workout program." />
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