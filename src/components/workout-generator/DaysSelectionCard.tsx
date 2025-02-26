import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import type { DaysSelectionCardProps } from "./types";

export function DaysSelectionCard({ 
  numberOfDays, 
  setNumberOfDays, 
  renderTooltip 
}: DaysSelectionCardProps) {
  const handleDaySelection = (value: string) => {
    setNumberOfDays(parseInt(value || "7"));
  };

  return (
    <Card className="bg-black/20 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-primary">
            How many days would you like to train?
          </h3>
          {renderTooltip()}
        </div>
      </CardHeader>
      <CardContent>
        <ToggleGroup 
          type="single" 
          value={numberOfDays.toString()}
          onValueChange={handleDaySelection}
          className="flex flex-wrap gap-2"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => (
            <ToggleGroupItem 
              key={day} 
              value={day.toString()}
              className="h-14 w-14 rounded-full bg-black/20 text-white data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-white/20"
            >
              {day}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}
