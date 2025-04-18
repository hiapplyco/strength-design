
import React from "react";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { ActionButtons } from "./ActionButtons";
import { ConfigurationSummary } from "./ConfigurationSummary";
import type { GenerateSectionProps } from "./types";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();
  const hasSelections = Boolean(
    selectedExercises.length > 0 || 
    fitnessLevel || 
    prescribedExercises || 
    injuries || 
    numberOfDays > 0 || 
    weatherData
  );

  return (
    <Card className={theme === 'light' ? 'border-gray-200 bg-white/80' : ''}>
      <CardHeader className="p-4">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-lg">Create Your Workout</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <ActionButtons
            onGenerate={onGenerate}
            onClear={onClear}
            isGenerating={isGenerating}
            isValid={isValid}
          />
          
          {hasSelections && (
            <div className="mt-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
