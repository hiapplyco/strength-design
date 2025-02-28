
import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Dumbbell } from "lucide-react";
import { Button } from "../ui/button";
import type { DaysSelectionCardProps } from "./types";

export function DaysSelectionCard({ 
  numberOfDays, 
  setNumberOfDays,
  renderTooltip
}: DaysSelectionCardProps) {
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <Card className="bg-black/20 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Training Days</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {days.map((day) => (
            <Button
              key={day}
              variant={numberOfDays === day ? "default" : "outline"}
              onClick={() => setNumberOfDays(day)}
              className="h-12 w-full"
            >
              {day}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
