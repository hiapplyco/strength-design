import React from "react";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { DaysSelectionCard } from "./DaysSelectionCard";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { ActionButtons } from "./ActionButtons";
import type { GenerateSectionProps } from "./types";

export function GenerateSection({ 
  onGenerate, 
  onClear,
  isGenerating,
  renderTooltip,
  isValid,
  selectedExercises = [],
  fitnessLevel = "",
  prescribedExercises = "",
  injuries = "",
  numberOfDays = 0,
  setNumberOfDays,
  weatherData
}: GenerateSectionProps) {
  const hasSelections = Boolean(
    selectedExercises.length > 0 || 
    fitnessLevel || 
    prescribedExercises || 
    injuries || 
    numberOfDays > 0 || 
    weatherData
  );

  return (
    <div className="space-y-8">
      <DaysSelectionCard 
        numberOfDays={numberOfDays}
        setNumberOfDays={setNumberOfDays}
        renderTooltip={renderTooltip}
      />

      <Card className="bg-black/20 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Create Your Workout</h3>
            {renderTooltip()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasSelections && (
            <ConfigurationSummary 
              numberOfDays={numberOfDays}
              fitnessLevel={fitnessLevel}
              selectedExercises={selectedExercises}
              prescribedExercises={prescribedExercises}
              injuries={injuries}
              weatherData={weatherData}
            />
          )}

          <ActionButtons 
            onGenerate={onGenerate}
            onClear={onClear}
            isGenerating={isGenerating}
            isValid={isValid}
          />
        </CardContent>
      </Card>
    </div>
  );
}
