
import { Dumbbell, HeartPulse } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { TooltipWrapper } from "./TooltipWrapper";

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
  isAnalyzingPrescribed,
  handlePrescribedFileSelect,
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect,
}: GoalsAndInjuriesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">What are your fitness goals?</h3>
          <TooltipWrapper content="Tell us about your fitness goals to help AI personalize your workout plan" />
        </div>
        <Textarea
          value={prescribedExercises}
          onChange={(e) => setPrescribedExercises(e.target.value)}
          placeholder="List any specific exercises you need to include"
          className="min-h-[100px]"
          borderStyle="multicolor"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Any injuries or health considerations?</h3>
          <TooltipWrapper content="List any injuries or health conditions that your workout should accommodate" />
        </div>
        <Textarea 
          value={injuries}
          onChange={(e) => setInjuries(e.target.value)}
          placeholder="List any injuries or health conditions"
          className="min-h-[100px]"
          borderStyle="multicolor"
        />
      </div>
    </div>
  );
}
