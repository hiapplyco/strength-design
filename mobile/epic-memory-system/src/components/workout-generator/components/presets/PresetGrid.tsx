
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WORKOUT_PROGRAMS } from "../../constants/workoutPresets";

interface PresetGridProps {
  selectedWorkouts: Record<string, string>;
  onWorkoutSelect: (category: string, workoutName: string) => void;
}

export function PresetGrid({ selectedWorkouts, onWorkoutSelect }: PresetGridProps) {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(WORKOUT_PROGRAMS).map(([category, workouts]) => (
        <Card key={category} className={`p-4 relative overflow-hidden ${
          theme === 'light'
            ? 'bg-white/70 border-gray-200'
            : 'bg-black/50 border-transparent'
        }`}>
          <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
          <div className={`absolute inset-[1px] rounded-[calc(0.5rem-1px)] ${
            theme === 'light'
              ? 'bg-white/90'
              : 'bg-black/70'
          }`}></div>
          <div className="space-y-4 relative z-10">
            <h4 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-center">
              {category.replace(/_/g, ' ')}
            </h4>
            
            <Select 
              value={selectedWorkouts[category] || ''} 
              onValueChange={value => onWorkoutSelect(category, value)}
            >
              <SelectTrigger className={`w-full relative overflow-hidden ${
                theme === 'light'
                  ? 'bg-white/80 text-gray-800 border-gray-200'
                  : 'bg-black/60 text-white border-transparent'
              }`}>
                <SelectValue placeholder="Select a workout" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(workouts).map(([name, description]) => (
                  <TooltipProvider key={name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem 
                          value={name}
                          className={`cursor-pointer ${
                            theme === 'light'
                              ? 'text-gray-800 hover:bg-gradient-to-r hover:from-[#4CAF50]/5 hover:via-[#9C27B0]/5 hover:to-[#FF1493]/5'
                              : 'text-white hover:bg-gradient-to-r hover:from-[#4CAF50]/10 hover:via-[#9C27B0]/10 hover:to-[#FF1493]/10'
                          }`}
                        >
                          {name.replace(/_/g, ' ')}
                        </SelectItem>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        className="max-w-[300px] p-3"
                      >
                        {description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      ))}
    </div>
  );
}
