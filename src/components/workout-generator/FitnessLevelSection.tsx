
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface FitnessLevelSectionProps {
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
}

const fitnessLevels = [
  { level: "beginner", label: "Beginner" },
  { level: "intermediate", label: "Intermediate" },
  { level: "advanced", label: "Advanced" },
  { level: "elite", label: "Elite" },
];

export function FitnessLevelSection({
  fitnessLevel,
  setFitnessLevel,
}: FitnessLevelSectionProps) {
  const renderCustomContent = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {fitnessLevels.map(({ level, label }) => (
        <Button
          key={level}
          onClick={() => setFitnessLevel(level)}
          variant={fitnessLevel === level ? "default" : "outline"}
          className={cn(
            "w-full transition-all duration-200 flex items-center justify-center",
            fitnessLevel === level 
              ? "text-white" 
              : "bg-black/50 text-white hover:bg-black/70 border gradient-border"
          )}
        >
          <span className="capitalize">{label}</span>
        </Button>
      ))}
    </div>
  );

  return (
    <ExpandableSectionContainer
      icon={<Activity className="h-5 w-5 text-primary" />}
      title="What is your fitness level?"
      tooltipContent="Select your fitness level to receive appropriately challenging workouts"
      textAreaPlaceholder=""
      fileUploadTitle=""
      fileAnalysisSteps={[]}
      content={fitnessLevel}
      setContent={() => {}} // No-op since we handle selection differently
      isAnalyzing={false}
      handleFileSelect={async () => {}} // No-op for fitness level
      initialExpanded={false}
      renderCustomContent={renderCustomContent}
    />
  );
}
