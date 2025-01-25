import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FitnessSectionProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
  prescribedExercises: string;
  onPrescribedExercisesChange: (value: string) => void;
  injuries: string;
  onInjuriesChange: (value: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function FitnessSection({
  fitnessLevel,
  onFitnessLevelChange,
  prescribedExercises,
  onPrescribedExercisesChange,
  injuries,
  onInjuriesChange,
  renderTooltip,
}: FitnessSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Fitness Profile {renderTooltip()}</Label>
      </div>
      <Select value={fitnessLevel} onValueChange={onFitnessLevelChange}>
        <SelectTrigger className="bg-white text-black">
          <SelectValue placeholder="Select your fitness level" className="text-gray-400" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
          <SelectItem value="elite">Elite</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <Label>Injuries or Health Considerations</Label>
        <Textarea
          placeholder="List any injuries, medical conditions, or movement limitations that may affect your workout (e.g., knee pain, lower back issues, pregnancy)"
          value={injuries}
          onChange={(e) => onInjuriesChange(e.target.value)}
          className="min-h-[80px] bg-white text-black placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label>Prescribed Exercises</Label>
        <Textarea
          placeholder="Any specific exercises you need to include"
          value={prescribedExercises}
          onChange={(e) => onPrescribedExercisesChange(e.target.value)}
          className="min-h-[80px] bg-white text-black placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}