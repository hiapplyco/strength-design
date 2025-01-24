import { Activity } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { PdfUploadSection } from "./PdfUploadSection";

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
  const handleFileSelect = (file: File | null) => {
    // If there's a file, we can process its contents here
    // For now, we'll just pass an empty string if no file is selected
    onPrescribedExercisesChange(file ? '' : '');
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
        <PdfUploadSection onFileSelect={handleFileSelect} />
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