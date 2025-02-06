import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { WORKOUT_PROGRAMS, PRESET_CONFIGS } from './constants/workoutPresets';
import { useGeminiExerciseExtraction } from './hooks/useGeminiExerciseExtraction';
import type { Exercise } from "../exercise-search/types";

interface WorkoutPresetsProps {
  onSelectPreset: (preset: {
    title: string;
    prescribedExercises: string;
    fitnessLevel: string;
    numberOfDays: number;
  }) => void;
  onExercisesExtracted?: (exercises: Exercise[]) => void;
}

export function WorkoutPresets({ onSelectPreset, onExercisesExtracted }: WorkoutPresetsProps) {
  const [selectedWorkouts, setSelectedWorkouts] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState(false);
  const [visible, setVisible] = useState(true);
  const { extractExercises, isExtracting } = useGeminiExerciseExtraction();

  const handleWorkoutSelect = async (category: string, workoutName: string) => {
    const preset = PRESET_CONFIGS[workoutName as keyof typeof PRESET_CONFIGS];
    
    if (preset) {
      setSelectedWorkouts({
        [category]: workoutName
      });
      
      const categoryKey = Object.keys(WORKOUT_PROGRAMS).find(cat => 
        Object.keys(WORKOUT_PROGRAMS[cat as keyof typeof WORKOUT_PROGRAMS]).includes(workoutName)
      ) as keyof typeof WORKOUT_PROGRAMS | undefined;
      
      if (categoryKey) {
        const workoutDescription = WORKOUT_PROGRAMS[categoryKey][workoutName as keyof (typeof WORKOUT_PROGRAMS)[typeof categoryKey]];
        
        const formattedPreset = {
          title: preset.title,
          prescribedExercises: `${preset.title}\n\nDescription:\n${workoutDescription}\n\nWorkout Details:\n${preset.prescribedExercises}`,
          fitnessLevel: preset.fitnessLevel,
          numberOfDays: preset.numberOfDays
        };

        if (onExercisesExtracted) {
          const exercises = await extractExercises(formattedPreset.prescribedExercises);
          onExercisesExtracted(exercises);
        }
        
        onSelectPreset(formattedPreset);
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="space-y-4 relative border border-red-500/30 rounded-lg p-4">
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 text-red-500/70 hover:text-red-500 transition-colors"
        aria-label="Close workout presets"
      >
        <X size={20} />
      </button>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-white">Sample Workouts</h3>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-between bg-black/50 text-white border-primary/20"
        onClick={() => setShowPresets(!showPresets)}
      >
        <span>Would you like to try a sample workout from our database?</span>
        {showPresets ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {showPresets && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-sm text-gray-300 text-center mb-4">
            Drawing from our database of thousands of user-submitted and expert-curated workouts, we've handpicked some 
            popular training templates to help you get started.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(WORKOUT_PROGRAMS).map(([category, workouts]) => (
              <Card 
                key={category}
                className="p-4 bg-black/50 border-2 border-primary/20"
              >
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white text-center">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  
                  <Select
                    value={selectedWorkouts[category] || ''}
                    onValueChange={(value) => handleWorkoutSelect(category, value)}
                  >
                    <SelectTrigger className="w-full bg-black/60 text-white border-primary">
                      <SelectValue placeholder="Select a workout" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-primary">
                      {Object.entries(workouts).map(([name, description]) => (
                        <TooltipProvider key={name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem 
                                value={name}
                                className="text-white hover:bg-primary/20 cursor-pointer"
                              >
                                {name.replace(/_/g, ' ')}
                              </SelectItem>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right"
                              className="max-w-[300px] bg-black/90 text-white p-3 border-primary"
                            >
                              <p>{description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            ))}
          </div>

          {isExtracting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-black p-6 rounded-lg border-2 border-primary flex items-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-white">Analyzing workout and extracting exercises...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}