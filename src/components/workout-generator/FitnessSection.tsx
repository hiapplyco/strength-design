import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PdfUploadSection } from "./PdfUploadSection";
import { ExerciseSection } from "./ExerciseSection";
import { TooltipWrapper } from "./TooltipWrapper";

export const FitnessSection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exercises, setExercises] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      console.log("[FitnessSection] Sending file to Supabase Edge Function...");

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://ulnsvkrrdcmfiguibkpx.supabase.co/functions/v1/process-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      console.log("[FitnessSection] Response status:", response.status);
      const rawResponse = await response.text();
      console.log("[FitnessSection] Raw response:", rawResponse);

      if (!response.ok) {
        throw new Error(`Failed to process file: ${rawResponse}`);
      }

      const data = JSON.parse(rawResponse);
      if (data.exercises && Array.isArray(data.exercises)) {
        setExercises(data.exercises);
        setSelectedFile(file);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.log("[FitnessSection] Error processing file:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setSelectedFile(null);
      setExercises([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExerciseRemove = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleExerciseAdd = (exercise: string) => {
    setExercises(prev => [...prev, exercise]);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <TooltipWrapper
            content="Upload a PDF file containing your previous workouts or exercise history"
            side="right"
          >
            <div>
              <PdfUploadSection
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                error={error}
              />
            </div>
          </TooltipWrapper>

          <TooltipWrapper
            content="Add or remove exercises that you'd like to include in your workout"
            side="right"
          >
            <div>
              <ExerciseSection
                exercises={exercises}
                onExerciseAdd={handleExerciseAdd}
                onExerciseRemove={handleExerciseRemove}
              />
            </div>
          </TooltipWrapper>
        </div>
      </CardContent>
    </Card>
  );
};