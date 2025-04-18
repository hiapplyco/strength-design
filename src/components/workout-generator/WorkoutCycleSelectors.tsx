
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface WorkoutCycleSelectorsProps {
  numberOfCycles: number;
  setNumberOfCycles: (value: number) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function WorkoutCycleSelectors({
  numberOfCycles,
  setNumberOfCycles,
  numberOfDays,
  setNumberOfDays
}: WorkoutCycleSelectorsProps) {
  const { theme } = useTheme();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/90">Number of Cycles</label>
        <Select
          value={numberOfCycles.toString()}
          onValueChange={(value) => setNumberOfCycles(parseInt(value))}
        >
          <SelectTrigger className={cn(
            "w-full",
            theme === 'light' ? 'bg-white' : 'bg-background'
          )}>
            <SelectValue placeholder="Select cycles" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'Cycle' : 'Cycles'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/90">Days per Cycle</label>
        <Select
          value={numberOfDays.toString()}
          onValueChange={(value) => setNumberOfDays(parseInt(value))}
        >
          <SelectTrigger className={cn(
            "w-full",
            theme === 'light' ? 'bg-white' : 'bg-background'
          )}>
            <SelectValue placeholder="Select days" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'Day' : 'Days'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
