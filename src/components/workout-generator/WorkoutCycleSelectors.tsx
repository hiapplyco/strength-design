
import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Dumbbell, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useTheme } from "@/contexts/ThemeContext";

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
  const maxCycles = 4;
  const maxDays = 7;

  return (
    <Card className={theme === 'light' ? 'border-gray-200 bg-white/80' : ''}>
      <CardHeader className="p-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-lg">Training Structure</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Cycles</label>
            <Select 
              value={numberOfCycles.toString()} 
              onValueChange={(value) => setNumberOfCycles(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cycles" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: maxCycles}, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Cycle' : 'Cycles'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Days per Cycle</label>
            <Select 
              value={numberOfDays.toString()} 
              onValueChange={(value) => setNumberOfDays(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: maxDays}, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Day' : 'Days'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
