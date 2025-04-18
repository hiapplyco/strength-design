
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
      "p-4 relative overflow-hidden",
      theme === 'light'
        ? 'bg-white/70 border-gray-200'
        : 'bg-black/50 border-transparent'
    )}>
      <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
      <div className={cn(
        "absolute inset-[1px] rounded-[calc(0.5rem-1px)]",
        theme === 'light' ? 'bg-white/90' : 'bg-black/70'
      )}></div>
      
      <div className="space-y-4 relative z-10">
        <h4 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-center">
          {category.replace(/_/g, ' ')}
        </h4>
        
        <Select 
          value={selectedWorkout || ''} 
          onValueChange={value => onSelect(category, value)}
        >
          <SelectTrigger className={cn(
            "w-full relative overflow-hidden",
            theme === 'light'
              ? 'bg-white/80 text-gray-800 border-gray-200 placeholder:text-gray-600'
              : 'bg-black/60 text-white border-transparent'
          )}>
            <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
            <div className={cn(
              "absolute inset-[1px] rounded-[calc(0.375rem-1px)]",
              theme === 'light' ? 'bg-white/90' : 'bg-black/70'
            )}></div>
            <SelectValue placeholder="Select a workout" className="relative z-10" />
          </SelectTrigger>
          
          <SelectContent className={cn(
            "relative",
            theme === 'light'
              ? 'bg-white/95 border-gray-200'
              : 'bg-black/95 border-transparent'
          )}>
            <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
            <div className={cn(
              "absolute inset-[1px] rounded-[calc(0.375rem-1px)]",
              theme === 'light' ? 'bg-white/95' : 'bg-black/95'
            )}></div>
            
            {Object.entries(workouts).map(([name, description]) => (
              <TooltipProvider key={name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectItem value={name} className={cn(
                      "cursor-pointer relative z-10",
                      theme === 'light'
                        ? 'text-gray-800 hover:bg-gradient-to-r hover:from-[#4CAF50]/5 hover:via-[#9C27B0]/5 hover:to-[#FF1493]/5'
                        : 'text-white hover:bg-gradient-to-r hover:from-[#4CAF50]/10 hover:via-[#9C27B0]/10 hover:to-[#FF1493]/10'
                    )}>
                      {name.replace(/_/g, ' ')}
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={cn(
                    "max-w-[300px] p-3 border-transparent relative overflow-hidden",
                    theme === 'light'
                      ? 'bg-white/90 text-gray-800'
                      : 'bg-black/90 text-white'
                  )}>
                    <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                    <div className={cn(
                      "absolute inset-[1px] rounded-[calc(0.375rem-1px)]",
                      theme === 'light' ? 'bg-white/95' : 'bg-black/95'
                    )}></div>
                    <p className="relative z-10">{description}</p>
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
