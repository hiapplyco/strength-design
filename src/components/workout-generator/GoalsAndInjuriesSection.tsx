
import { Target, Heart } from "lucide-react";
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
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">What are your Goals?</h3>
          <TooltipWrapper content="Tell us about your fitness goals to help AI personalize your workout plan" />
        </div>
        <Textarea
          value={prescribedExercises}
          onChange={(e) => setPrescribedExercises(e.target.value)}
          placeholder="List any specific exercises you need to include"
          rows={4}
          borderStyle="multicolor"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Any Injuries or Health Considerations?</h3>
          <TooltipWrapper content="Let us know about any injuries or health issues to ensure a safe workout plan" />
        </div>
        <Textarea
          value={injuries}
          onChange={(e) => setInjuries(e.target.value)}
          placeholder="List any injuries, medical conditions, or movement limitations"
          rows={4}
          borderStyle="multicolor"
        />
      </div>
    </div>
  );
}
