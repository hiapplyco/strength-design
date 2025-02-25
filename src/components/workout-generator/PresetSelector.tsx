
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const WORKOUT_PRESETS = [
  { name: "Beginner Home Workout", level: "Beginner", days: 3, prompt: "No equipment home workout for beginners" },
  { name: "Weight Loss", level: "Intermediate", days: 5, prompt: "Focus on calorie burn and fat loss" },
  { name: "Muscle Building", level: "Intermediate", days: 4, prompt: "Hypertrophy-focused with progressive overload" },
  { name: "Full Athletic Program", level: "Advanced", days: 6, prompt: "Strength, power, and conditioning for athletes" }
];

interface PresetSelectorProps {
  selectedPreset: string | null;
  onPresetSelect: (preset: typeof WORKOUT_PRESETS[0]) => void;
}

export function PresetSelector({ selectedPreset, onPresetSelect }: PresetSelectorProps) {
  return (
    <div className="mb-8 bg-black/70 p-4 rounded-lg">
      <div className="flex items-center mb-2">
        <h3 className="text-white text-lg font-semibold mr-2">Quick Start with Templates</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={16} className="text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              Select a template to quickly generate a workout plan with pre-configured settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WORKOUT_PRESETS.map((preset) => (
          <div 
            key={preset.name}
            onClick={() => onPresetSelect(preset)}
            className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
              selectedPreset === preset.name 
                ? 'border-destructive bg-destructive/10' 
                : 'border-gray-700 bg-black/50 hover:bg-black/80'
            }`}
          >
            <h4 className="font-medium text-white">{preset.name}</h4>
            <div className="flex mt-1 gap-2">
              <Badge variant="outline">{preset.level}</Badge>
              <Badge variant="outline">{preset.days} Days</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
