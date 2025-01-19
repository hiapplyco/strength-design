import { Activity } from "lucide-react";
import { Input } from "../ui/input";

interface FitnessSectionProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
}

export function FitnessSection({ fitnessLevel, onFitnessLevelChange }: FitnessSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Activity className="h-5 w-5" />
        <h3 className="font-oswald text-lg uppercase">Fitness Level</h3>
      </div>
      <Input
        placeholder="e.g., 'Intermediate, RX weights, moderate fatigue from yesterday's session'"
        value={fitnessLevel}
        onChange={(e) => onFitnessLevelChange(e.target.value)}
        className="bg-white text-black placeholder:text-gray-500"
      />
      {fitnessLevel && (
        <div className="bg-primary/10 rounded-lg p-4 text-sm animate-fade-in">
          <p className="font-semibold text-primary">Fitness Profile:</p>
          <p>{fitnessLevel}</p>
        </div>
      )}
    </div>
  );
}