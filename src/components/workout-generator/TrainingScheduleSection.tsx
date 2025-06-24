
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface TrainingScheduleSectionProps {
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  numberOfCycles: number;
  setNumberOfCycles: (value: number) => void;
}

export function TrainingScheduleSection({
  numberOfDays,
  setNumberOfDays,
  numberOfCycles,
  setNumberOfCycles,
}: TrainingScheduleSectionProps) {
  const days = [1, 2, 3, 4, 5, 6, 7];

  const renderCustomContent = () => (
    <div className="space-y-6">
      {/* Days Selection */}
      <div>
        <label className="text-sm font-medium text-foreground/90 mb-3 block">
          Days per cycle: {numberOfDays}
        </label>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {days.map((day) => (
            <Button
              key={day}
              onClick={() => setNumberOfDays(day)}
              variant={numberOfDays === day ? "default" : "outline"}
              className={cn(
                "h-10 w-full transition-all duration-200",
                numberOfDays === day 
                  ? "text-white" 
                  : "bg-black/50 text-white hover:bg-black/70 border gradient-border"
              )}
              size="sm"
            >
              {day}
            </Button>
          ))}
        </div>
      </div>

      {/* Cycles Selection */}
      <div>
        <label className="text-sm font-medium text-foreground/90 mb-3 block">
          Number of cycles: {numberOfCycles}
        </label>
        <Select
          value={numberOfCycles.toString()}
          onValueChange={(value) => setNumberOfCycles(parseInt(value))}
        >
          <SelectTrigger className="w-full bg-black/50 text-white border gradient-border">
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
        <p className="text-xs text-muted-foreground mt-2">
          Total workouts: {numberOfCycles * numberOfDays}
        </p>
      </div>
    </div>
  );

  return (
    <ExpandableSectionContainer
      icon={<Calendar className="h-5 w-5 text-primary" />}
      title="Training Schedule"
      tooltipContent="Set the number of training days per cycle and total cycles for your program"
      textAreaPlaceholder=""
      fileUploadTitle=""
      fileAnalysisSteps={[]}
      content={`${numberOfCycles} cycle(s) of ${numberOfDays} days`}
      setContent={() => {}} // No-op since we handle selection differently
      isAnalyzing={false}
      handleFileSelect={async () => {}} // No-op for training schedule
      initialExpanded={false}
      renderCustomContent={renderCustomContent}
    />
  );
}
