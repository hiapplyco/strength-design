
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PresetCardProps {
  category: string;
  workouts: Record<string, string>;
  selectedWorkout: string;
  onSelect: (category: string, workoutName: string) => void;
}

export function PresetCard({
  category,
  workouts,
  selectedWorkout,
  onSelect
}: PresetCardProps) {
  return (
    <Card variant="interactive" className="p-6">
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-primary">
          {category.replace(/_/g, ' ')}
        </h4>
        
        <Select 
          value={selectedWorkout || ''} 
          onValueChange={value => onSelect(category, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a workout" />
          </SelectTrigger>
          
          <SelectContent>
            {Object.entries(workouts).map(([name, description]) => (
              <TooltipProvider key={name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectItem 
                      value={name} 
                      className="cursor-pointer"
                    >
                      {name.replace(/_/g, ' ')}
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className="max-w-[300px] p-4"
                  >
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
