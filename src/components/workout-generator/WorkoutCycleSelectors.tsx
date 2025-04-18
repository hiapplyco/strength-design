
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-white/80">Number of Cycles</label>
        <Select
          value={numberOfCycles.toString()}
          onValueChange={(value) => setNumberOfCycles(parseInt(value))}
        >
          <SelectTrigger className="w-full bg-card/50">
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

      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-white/80">Days per Cycle</label>
        <Select
          value={numberOfDays.toString()}
          onValueChange={(value) => setNumberOfDays(parseInt(value))}
        >
          <SelectTrigger className="w-full bg-card/50">
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
