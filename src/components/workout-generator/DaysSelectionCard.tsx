
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
    <Card className="bg-black/20 border-0 rounded-xl w-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-primary/5 to-pink-500/10 rounded-xl" />
      <CardHeader className="p-3 sm:p-4 relative z-10">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="text-lg">Training Days</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 relative z-10">
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 w-full">
          {days.map((day) => (
            <Button
              key={day}
              variant={numberOfDays === day ? "default" : "outline"}
              onClick={() => setNumberOfDays(day)}
              className={`h-10 sm:h-12 w-full text-center relative ${
                numberOfDays === day 
                  ? "text-white"
                  : "bg-black/40 text-white border-0 hover:bg-black/60"
              }`}
              size="sm"
            >
              {numberOfDays === day && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-90 hover:opacity-100 transition-opacity rounded-md"></div>
              )}
              <span className="relative z-10">{day}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
