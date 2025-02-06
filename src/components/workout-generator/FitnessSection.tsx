import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Dumbbell, Activity, BicepsFlexed } from "lucide-react";
import { cn } from "@/lib/utils";

interface FitnessSectionProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
  renderTooltip: () => React.ReactNode;
}

const fitnessLevels = [
  { value: "beginner", label: "Beginner", icon: User },
  { value: "intermediate", label: "Intermediate", icon: Dumbbell },
  { value: "advanced", label: "Advanced", icon: Activity },
  { value: "elite", label: "Elite", icon: BicepsFlexed },
];

export function FitnessSection({
  fitnessLevel,
  onFitnessLevelChange,
  renderTooltip,
}: FitnessSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Fitness Profile {renderTooltip()}</Label>
      </div>
      
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {fitnessLevels.map((level) => {
          const Icon = level.icon;
          return (
            <Button
              key={level.value}
              onClick={() => onFitnessLevelChange(level.value)}
              variant={fitnessLevel === level.value ? "default" : "outline"}
              className={cn(
                "flex items-center gap-2 h-auto py-4",
                fitnessLevel === level.value ? "bg-primary text-white" : "hover:bg-primary/10"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{level.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}