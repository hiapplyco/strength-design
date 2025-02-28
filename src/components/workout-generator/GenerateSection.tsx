
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
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={onGenerate}
              disabled={isGenerating || !isValid}
              className="w-full py-3 flex justify-center items-center bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="mr-2 h-4 w-4" />
                  GENERATE
                </span>
              )}
            </button>
            
            <button
              onClick={onClear}
              disabled={isGenerating}
              className="w-full py-3 flex justify-center items-center bg-transparent text-white font-medium rounded-lg border border-red-500/50 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </button>
          </div>
          
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
