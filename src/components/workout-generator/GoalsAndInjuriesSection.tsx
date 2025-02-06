
import { Dumbbell, HeartPulse, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";
import { useGeminiExerciseExtraction } from "./hooks/useGeminiExerciseExtraction";
import { useState } from "react";

interface GoalsAndInjuriesSectionProps {
  prescribedExercises: string;
  setPrescribedExercises: (value: string) => void;
  isAnalyzingPrescribed: boolean;
  handlePrescribedFileSelect: (file: File) => Promise<void>;
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
}

export function GoalsAndInjuriesSection({
  prescribedExercises,
  setPrescribedExercises,
  isAnalyzingPrescribed,
  handlePrescribedFileSelect,
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect
}: GoalsAndInjuriesSectionProps) {
  const { parseDocument: parseExercises, isExtracting: isParsingExercises, isSuccess: isPrescribedSuccess } = useGeminiExerciseExtraction();
  const { parseDocument: parseInjuries, isExtracting: isParsingInjuries, isSuccess: isInjuriesSuccess } = useGeminiExerciseExtraction();
  
  const handleClearPrescribed = () => {
    setPrescribedExercises("");
  };

  const handleClearInjuries = () => {
    setInjuries("");
  };

  const handlePrescribedUpload = async (file: File) => {
    const result = await parseExercises(file);
    if (result.success) {
      setPrescribedExercises(prescribedExercises ? `${prescribedExercises}\n${result.text}` : result.text);
    }
  };

  const handleInjuriesUpload = async (file: File) => {
    const result = await parseInjuries(file);
    if (result.success) {
      setInjuries(injuries ? `${injuries}\n${result.text}` : result.text);
    }
  };

  return (
    <div className="space-y-6 bg-jupyter-cell border border-jupyter-border rounded-[20px] p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 sm:justify-start justify-center">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg text-white sm:text-left text-center">Goals</h3>
          <TooltipWrapper content="Share your fitness goals and specific exercises you'd like to include in your workout program." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Textarea
              placeholder="List exercises you want to include"
              value={prescribedExercises}
              onChange={(e) => setPrescribedExercises(e.target.value)}
              className="min-h-[100px] bg-jupyter-cell border border-jupyter-border rounded-[20px] px-6 py-4 w-full focus:border-primary focus:ring-1 focus:ring-primary text-white text-center sm:text-left"
            />
          </div>
          <div className="lg:col-span-1">
            <FileUploadSection
              title="Upload Exercise Program"
              isAnalyzing={isParsingExercises}
              isSuccess={isPrescribedSuccess}
              content={prescribedExercises}
              onFileSelect={handlePrescribedUpload}
              analysisSteps={["Processing file", "Extracting exercises", "Analyzing content"]}
            />
          </div>
        </div>

        {prescribedExercises && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearPrescribed}
              className="hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-jupyter-border my-6" />

      <div className="space-y-4">
        <div className="flex items-center gap-3 sm:justify-start justify-center">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg text-white sm:text-left text-center">Health Considerations</h3>
          <TooltipWrapper content="Share any injuries, medical conditions, or movement limitations that may affect your workout" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Textarea
              placeholder="List injuries or limitations"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className="min-h-[100px] bg-jupyter-cell border border-jupyter-border rounded-[20px] px-6 py-4 w-full focus:border-primary focus:ring-1 focus:ring-primary text-white text-center sm:text-left"
            />
          </div>
          <div className="lg:col-span-1">
            <FileUploadSection
              title="Upload Medical Information"
              isAnalyzing={isParsingInjuries}
              isSuccess={isInjuriesSuccess}
              content={injuries}
              onFileSelect={handleInjuriesUpload}
              analysisSteps={["Processing file", "Extracting information", "Analyzing content"]}
            />
          </div>
        </div>

        {injuries && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearInjuries}
              className="hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
