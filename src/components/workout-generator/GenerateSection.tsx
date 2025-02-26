
import React from "react";
import { Send, Loader2, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Separator } from "../ui/separator";
import type { Exercise } from "../exercise-search/types";

interface GenerateSectionProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  renderTooltip: () => React.ReactNode;
  isValid: boolean;
  selectedExercises?: Exercise[];
  fitnessLevel?: string;
  prescribedExercises?: string;
  injuries?: string;
  numberOfDays?: number;
  setNumberOfDays: (value: number) => void;
  weatherData?: any;
}

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

  const handleDaySelection = (value: string) => {
    setNumberOfDays(parseInt(value || "7"));
  };

  const handleGenerate = () => {
    if (isValid && !isGenerating) {
      onGenerate();
    }
  };

  return (
    <div className="space-y-8">
      {/* Days Selection Card - Now in its own container */}
      <Card className="bg-black/20 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-primary">
              How many days would you like to train?
            </h3>
            {renderTooltip()}
          </div>
        </CardHeader>
        <CardContent>
          <ToggleGroup 
            type="single" 
            value={numberOfDays.toString()}
            onValueChange={handleDaySelection}
            className="flex flex-wrap gap-2"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => (
              <ToggleGroupItem 
                key={day} 
                value={day.toString()}
                className="h-14 w-14 rounded-full bg-black/20 text-white data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-white/20"
              >
                {day}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      {/* Create Your Workout Section - Now in its own container */}
      <Card className="bg-black/20 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Create Your Workout</h3>
            {renderTooltip()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Summary Card - only shown when options are selected */}
          {hasSelections && (
            <Card className="bg-black/20 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Your Workout Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  {/* Training Days Summary */}
                  {numberOfDays > 0 && (
                    <ConfigSection 
                      title="Training Days"
                      content={`${numberOfDays} day${numberOfDays > 1 ? 's' : ''} of training`}
                    />
                  )}
                  
                  {/* Fitness Level Summary */}
                  {fitnessLevel && (
                    <ConfigSection 
                      title="Fitness Level"
                      content={fitnessLevel}
                      capitalize
                    />
                  )}

                  {/* Selected Exercises Summary */}
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

                  {/* Prescribed Exercises Summary */}
                  {prescribedExercises && (
                    <ConfigSection 
                      title="Prescribed Exercises"
                      content={prescribedExercises}
                    />
                  )}

                  {/* Health Considerations Summary */}
                  {injuries && (
                    <ConfigSection 
                      title="Health Considerations"
                      content={injuries}
                    />
                  )}

                  {/* Weather Conditions Summary */}
                  {weatherData && (
                    <ConfigSection 
                      title="Weather Conditions"
                      content="Weather data available for workout optimization"
                    />
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !isValid}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-oswald uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
            <Button 
              onClick={onClear}
              variant="outline"
              disabled={isGenerating}
              className="w-full hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Reusable configuration section component for the summary card
interface ConfigSectionProps {
  title: string;
  content: string;
  capitalize?: boolean;
}

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

