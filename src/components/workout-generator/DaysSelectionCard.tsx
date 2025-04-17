
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
    <Card className="bg-black/20 border-0 rounded-xl w-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-purple-500/10 rounded-xl" />
      <CardHeader className="p-3 sm:p-4 relative z-10">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg text-white font-medium">Training Days</h3>
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
              className={cn(
                "h-10 sm:h-12 w-full text-center relative", 
                numberOfDays === day 
                  ? "text-white" 
                  : "bg-black/40 text-white/70 border-0 hover:bg-black/60 hover:text-white"
              )}
              size="sm"
            >
              {numberOfDays === day && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-primary to-purple-500 opacity-90 hover:opacity-100 transition-opacity rounded-md"></div>
              )}
              <span className="relative z-10">{day}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
