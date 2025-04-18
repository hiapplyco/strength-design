
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
        ? 'bg-white shadow-md border border-gray-200'
        : 'bg-black/50 border-transparent'
    )}>
      <div className="space-y-4">
        <h4 className="text-lg font-semibold bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-transparent text-center">
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
              : 'bg-black/60 border-transparent text-white'
          )}>
            <SelectValue placeholder="Select a workout" />
          </SelectTrigger>
          
          <SelectContent className={cn(
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-black/95 border-transparent'
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
                          : 'text-white hover:bg-white/10'
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
                        ? 'bg-white text-gray-900 border border-gray-200'
                        : 'bg-black/90 text-white border-transparent'
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
