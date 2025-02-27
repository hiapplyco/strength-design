
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import type { ConfigurationSummaryProps, ConfigSectionProps } from "./types";

function ConfigSection({ title, content, capitalize = false }: ConfigSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="font-semibold text-primary text-lg mb-2">{title}</h4>
      <p className={`text-base text-white/80 ${capitalize ? 'capitalize' : ''}`}>
        {content}
      </p>
    </div>
  );
}

export function ConfigurationSummary({
  numberOfDays,
  fitnessLevel,
  selectedExercises,
  prescribedExercises,
  injuries,
  weatherData
}: ConfigurationSummaryProps) {
  return (
    <Card className="bg-black/30 border-primary/30 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-primary font-oswald tracking-wide">Your Workout Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[40vh] rounded-md border border-primary/20 bg-black/40 p-6">
          {numberOfDays > 0 && (
            <ConfigSection 
              title="Training Days"
              content={`${numberOfDays} day${numberOfDays > 1 ? 's' : ''} of training`}
            />
          )}
          
          {fitnessLevel && (
            <ConfigSection 
              title="Fitness Level"
              content={fitnessLevel}
              capitalize
            />
          )}

          {selectedExercises.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-primary text-lg mb-2">Selected Exercises</h4>
              <ul className="list-disc list-inside text-base text-white/80 pl-2 space-y-1">
                {selectedExercises.map((exercise, index) => (
                  <li key={index} className="pl-2">{exercise.name}</li>
                ))}
              </ul>
            </div>
          )}

          {prescribedExercises && (
            <ConfigSection 
              title="Prescribed Exercises"
              content={prescribedExercises}
            />
          )}

          {injuries && (
            <ConfigSection 
              title="Health Considerations"
              content={injuries}
            />
          )}

          {weatherData && (
            <ConfigSection 
              title="Weather Conditions"
              content="Weather data available for workout optimization"
            />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
