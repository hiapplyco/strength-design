
import React from "react";
import { Send, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { ActionButtons } from "./ActionButtons";
import { ConfigurationSummary } from "./ConfigurationSummary";
import type { GenerateSectionProps } from "./types";

export function GenerateSection({ 
  onGenerate, 
  onClear,
  isGenerating,
  renderTooltip,
  isValid,
  numberOfDays = 0,
  setNumberOfDays,
  selectedExercises = [],
  fitnessLevel = "",
  prescribedExercises = "",
  injuries = "",
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
      <Card className="bg-black/20 border border-primary/30 rounded-xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-primary/5 to-pink-500/10 rounded-xl" />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg text-primary">Create Your Workout</h3>
            {renderTooltip && renderTooltip()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <ActionButtons
            onGenerate={onGenerate}
            onClear={onClear}
            isGenerating={isGenerating}
            isValid={isValid}
          />
          
          {hasSelections && (
            <div className="mt-6">
              <ConfigurationSummary 
                numberOfDays={numberOfDays}
                fitnessLevel={fitnessLevel}
                selectedExercises={selectedExercises}
                prescribedExercises={prescribedExercises}
                injuries={injuries}
                weatherData={weatherData}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
