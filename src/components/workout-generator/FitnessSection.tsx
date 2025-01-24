import { Activity, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { PdfUploadSection } from "./PdfUploadSection";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FitnessSectionProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
  renderTooltip: () => React.ReactNode;
  prescribedExercises?: string;
  onPrescribedExercisesChange?: (value: string) => void;
}

export function FitnessSection({ 
  fitnessLevel, 
  onFitnessLevelChange, 
  renderTooltip,
  prescribedExercises = "",
  onPrescribedExercisesChange = () => {}
}: FitnessSectionProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      onPrescribedExercisesChange('');
      return;
    }

    setIsProcessing(true);
    console.log('Starting file processing...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const data = await response.json();
      console.log('Processed data:', data);
      
      onPrescribedExercisesChange(data.text || '');
      
      toast({
        title: "Success",
        description: "File processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Your Experience Level</h3>
        {renderTooltip()}
      </div>
      <RadioGroup value={fitnessLevel} onValueChange={onFitnessLevelChange} className="flex flex-col space-y-2">
        <div className="flex items-center">
          <RadioGroupItem value="beginner" id="fitness-beginner" />
          <Label htmlFor="fitness-beginner" className="ml-2">Beginner</Label>
        </div>
        <div className="flex items-center">
          <RadioGroupItem value="intermediate" id="fitness-intermediate" />
          <Label htmlFor="fitness-intermediate" className="ml-2">Intermediate</Label>
        </div>
        <div className="flex items-center">
          <RadioGroupItem value="advanced" id="fitness-advanced" />
          <Label htmlFor="fitness-advanced" className="ml-2">Advanced</Label>
        </div>
      </RadioGroup>

      <div className="space-y-2">
        <Label htmlFor="prescribed-exercises" className="text-sm font-medium">
          Prescribed Exercises (Optional)
        </Label>
        <div className="relative">
          <PdfUploadSection onFileSelect={handleFileSelect} />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing document...</span>
              </div>
            </div>
          )}
        </div>
        <Textarea
          id="prescribed-exercises"
          placeholder="Enter any prescribed exercises, PT recommendations, or medical restrictions..."
          value={prescribedExercises}
          onChange={(e) => onPrescribedExercisesChange(e.target.value)}
          className="min-h-[100px] resize-y bg-white text-black placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}