import { Dumbbell, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    setPrescribedExercises("");
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      className="w-full rounded-[20px] bg-jupyter-cell border border-jupyter-border overflow-hidden"
    >
      <div className="flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-3 flex-1">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg text-white whitespace-nowrap">What are your Goals?</h3>
          <TooltipWrapper content="Share your fitness goals and specific exercises you'd like to include in your workout program." />
        </div>
        <div className="flex items-center gap-2">
          {prescribedExercises && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-transparent hover:text-primary"
            >
              <span className="sr-only">Toggle Goals Section</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Textarea
              placeholder="List any specific exercises you need to include"
              value={prescribedExercises}
              onChange={(e) => setPrescribedExercises(e.target.value)}
              className="min-h-[100px] bg-jupyter-cell border border-jupyter-border rounded-[20px] px-6 py-4 w-full focus:border-primary focus:ring-1 focus:ring-primary text-white"
            />
          </div>
          <div className="md:col-span-1 min-w-[200px]">
            <FileUploadSection
              title="Upload Exercise Program"
              isAnalyzing={isAnalyzingPrescribed}
              content={prescribedExercises}
              onFileSelect={handlePrescribedFileSelect}
              analysisSteps={["Processing file", "Extracting exercises", "Analyzing content"]}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}