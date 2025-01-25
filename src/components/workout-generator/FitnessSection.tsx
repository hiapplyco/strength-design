import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PdfUploadSection } from "./PdfUploadSection";
import { supabase } from "@/integrations/supabase/client";
import { processImageWithTesseract } from "@/utils/tesseract";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FitnessSectionProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
  prescribedExercises: string;
  onPrescribedExercisesChange: (value: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function FitnessSection({
  fitnessLevel,
  onFitnessLevelChange,
  prescribedExercises,
  onPrescribedExercisesChange,
  renderTooltip
}: FitnessSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError("");

    try {
      const isImage = file.type.startsWith('image/');
      let extractedText = '';

      if (isImage) {
        // Process images with Tesseract
        toast({
          title: "Processing Image",
          description: "Extracting text from image using OCR...",
        });
        extractedText = await processImageWithTesseract(file);
      } else {
        // Process PDFs with Gemini
        const formData = new FormData();
        formData.append('file', file);

        const { data, error: functionError } = await supabase.functions.invoke('process-file', {
          body: formData,
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data?.text) {
          extractedText = data.text;
        }
      }

      if (extractedText) {
        onPrescribedExercisesChange(extractedText);
        toast({
          title: "Success",
          description: "Successfully extracted text from file",
        });
      }
    } catch (err) {
      console.error('[FitnessSection] Error processing file:', err);
      setError(err.message || 'Failed to process file');
      toast({
        title: "Error",
        description: err.message || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Fitness Profile</h3>
        {renderTooltip()}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            What's your fitness level?
          </label>
          <Select
            value={fitnessLevel}
            onValueChange={onFitnessLevelChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your fitness level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            Upload a document with prescribed exercises or restrictions
          </label>
          <PdfUploadSection
            onFileSelect={handleFileSelect}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {isProcessing && (
            <p className="text-sm text-muted-foreground">Processing file...</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            Any prescribed exercises or restrictions?
          </label>
          <Textarea
            value={prescribedExercises}
            onChange={(e) => onPrescribedExercisesChange(e.target.value)}
            placeholder="E.g., Physical therapy exercises, injury restrictions..."
            className="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}