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
      className="collapsible-section w-full space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="hover:bg-transparent hover:underline p-0">
              <h3 className="font-oswald text-lg">What are your Goals?</h3>
            </Button>
          </CollapsibleTrigger>
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
      
      <CollapsibleContent className="space-y-4 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <Textarea
              placeholder="List any specific exercises you need to include"
              value={prescribedExercises}
              onChange={(e) => setPrescribedExercises(e.target.value)}
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
      </CollapsibleContent>
    </Collapsible>
  );
}