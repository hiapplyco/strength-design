import { Activity, User, Dumbbell, BicepsFlexed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "./TooltipWrapper";

interface FitnessLevelSectionProps {
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
}

const fitnessLevels = [
  { level: "beginner", icon: User },
  { level: "intermediate", icon: Dumbbell },
  { level: "advanced", icon: Activity },
  { level: "elite", icon: BicepsFlexed },
];

export function FitnessLevelSection({
  fitnessLevel,
  setFitnessLevel
}: FitnessLevelSectionProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Fitness Level</h3>
        <TooltipWrapper content="Select your fitness level to receive appropriately challenging workouts." />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {fitnessLevels.map(({ level, icon: Icon }) => (
          <Button
            key={level}
            onClick={() => setFitnessLevel(level)}
            variant={fitnessLevel === level ? "default" : "outline"}
            className={cn(
              "w-full transition-colors duration-200 flex items-center gap-2 justify-center",
              fitnessLevel === level ? "bg-primary text-white" : "hover:bg-primary/10"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="capitalize">{level}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}