import { Activity, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { PdfUploadSection } from "./PdfUploadSection";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    console.log('[FitnessSection] Starting file processing...', { fileName: file.name, fileSize: file.size });

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[FitnessSection] Sending file to Supabase Edge Function...');
      
      const { data: { publicUrl } } = supabase
        .storage
        .from('photos')
        .getPublicUrl('public/anon-key.txt');

      const response = await fetch('https://ulnsvkrrdcmfiguibkpx.supabase.co/functions/v1/process-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      console.log('[FitnessSection] Response status:', response.status);
      
      const responseText = await response.text();
      console.log('[FitnessSection] Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to process file: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[FitnessSection] Error parsing JSON response:', e);
        throw new Error('Invalid response format from server');
      }

      console.log('[FitnessSection] Processed data received:', data);
      
      if (!data.text) {
        throw new Error('No text content in response');
      }

      onPrescribedExercisesChange(data.text);
      
      toast({
        title: "Success",
        description: "File processed successfully",
      });
    } catch (error) {
      console.error('[FitnessSection] Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      
      toast({
        title: "Error Processing File",
        description: errorMessage,
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