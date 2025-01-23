import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DaysSelectionProps {
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  renderTooltip: (content: string) => React.ReactNode;
}

export function DaysSelection({ numberOfDays, setNumberOfDays, renderTooltip }: DaysSelectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-white">How many days would you like to train?</h3>
        {renderTooltip("Select how many days of workouts to generate (1-12 days)")}
      </div>
      <ToggleGroup 
        type="single" 
        value={numberOfDays.toString()}
        onValueChange={(value) => setNumberOfDays(parseInt(value || "7"))}
        className="flex flex-wrap gap-2"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => (
          <ToggleGroupItem 
            key={day} 
            value={day.toString()}
            className="px-3 py-2 bg-white/10 text-white data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-white/20"
          >
            {day}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}