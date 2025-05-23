
import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Dumbbell } from "lucide-react";
import { Button } from "../ui/button";
import type { DaysSelectionCardProps } from "./types";
import { cn } from "@/lib/utils";

export function DaysSelectionCard({ 
  numberOfDays, 
  setNumberOfDays,
  renderTooltip
}: DaysSelectionCardProps) {
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <Card className="w-full">
      <CardHeader className="p-3 sm:p-4 pb-0">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Training Days</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 w-full">
          {days.map((day) => (
            <Button
              key={day}
              variant={numberOfDays === day ? "default" : "outline"}
              onClick={() => setNumberOfDays(day)}
              className={cn(
                "h-10 sm:h-12 w-full text-center"
              )}
              size="sm"
            >
              <span>{day}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
