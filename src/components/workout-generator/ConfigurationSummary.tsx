import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import type { ConfigurationSummaryProps, ConfigSectionProps } from "./types";
import type { Exercise } from "../exercise-search/types";

function ConfigSection({ title, content, capitalize = false }: ConfigSectionProps) {
  return (
    <div className="mb-4">
      <h4 className="font-semibold text-primary mb-1">{title}</h4>
      <p className={`text-sm text-muted-foreground ${capitalize ? 'capitalize' : ''}`}>
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
    <Card className="bg-black/20 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg text-primary">Your Workout Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[200px] rounded-md border p-4">
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
            <div className="mb-4">
              <h4 className="font-semibold text-primary mb-1">Selected Exercises</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {selectedExercises.map((exercise, index) => (
                  <li key={index}>{exercise.name}</li>
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
