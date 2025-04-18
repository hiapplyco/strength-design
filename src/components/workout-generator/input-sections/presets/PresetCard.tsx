
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { theme } = useTheme();
  
  return (
    <Card className={cn(
      "p-6",
      theme === 'light' 
        ? 'bg-white shadow-md' 
        : 'bg-zinc-900'
    )}>
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-primary">
          {category.replace(/_/g, ' ')}
        </h4>
        
        <Select 
          value={selectedWorkout || ''} 
          onValueChange={value => onSelect(category, value)}
        >
          <SelectTrigger className={cn(
            "w-full",
            theme === 'light'
              ? 'bg-white border-gray-200 text-gray-900'
              : 'bg-zinc-800 border-zinc-700 text-white'
          )}>
            <SelectValue placeholder="Select a workout" />
          </SelectTrigger>
          
          <SelectContent className={cn(
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-zinc-800 border-zinc-700'
          )}>
            {Object.entries(workouts).map(([name, description]) => (
              <TooltipProvider key={name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectItem 
                      value={name} 
                      className={cn(
                        "cursor-pointer",
                        theme === 'light'
                          ? 'text-gray-900 hover:bg-gray-50'
                          : 'text-white hover:bg-zinc-700'
                      )}
                    >
                      {name.replace(/_/g, ' ')}
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className={cn(
                      "max-w-[300px] p-4",
                      theme === 'light'
                        ? 'bg-white text-gray-900 border-gray-200'
                        : 'bg-zinc-800 text-white border-zinc-700'
                    )}
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
