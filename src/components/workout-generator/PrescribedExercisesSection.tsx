
import { Dumbbell, X, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClear = () => {
    setPrescribedExercises("");
  };

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg text-white">What are your Goals?</h3>
        <TooltipWrapper content="Share your fitness goals and specific exercises you'd like to include in your workout program." />
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="md:col-span-3">
                <Textarea
                  placeholder="List any specific exercises you need to include"
                  value={prescribedExercises}
                  onChange={(e) => setPrescribedExercises(e.target.value)}
                  className="min-h-[100px] rounded-[20px] px-6 py-4 w-full text-black"
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

            {prescribedExercises && (
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
