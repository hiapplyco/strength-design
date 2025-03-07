
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { WORKOUT_PROGRAMS, PRESET_CONFIGS } from '../constants/workoutPresets';
import { useGeminiExerciseExtraction } from '../hooks/useGeminiExerciseExtraction';
import type { Exercise } from "../../exercise-search/types";

interface PresetsSectionProps {
  onSelectPreset: (preset: {
    title: string;
    prescribedExercises: string;
    fitnessLevel: string;
    numberOfDays: number;
  }) => void;
  onExercisesExtracted?: (exercises: Exercise[]) => void;
  currentPrescribedExercises?: string;
}

export function PresetsSection({
  onSelectPreset,
  onExercisesExtracted,
  currentPrescribedExercises = ''
}: PresetsSectionProps) {
  const [selectedWorkouts, setSelectedWorkouts] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState(false);
  const [visible, setVisible] = useState(true);
  
  const {
    parseDocument,
    isExtracting
  } = useGeminiExerciseExtraction();

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
        
        const newWorkoutContent = `${preset.title}\n\nDescription:\n${workoutDescription}\n\nWorkout Details:\n${preset.prescribedExercises}`;
        
        const updatedExercises = currentPrescribedExercises 
          ? `${currentPrescribedExercises}\n\n------ NEW WORKOUT ------\n\n${newWorkoutContent}`
          : newWorkoutContent;
        
        const formattedPreset = {
          title: preset.title,
          prescribedExercises: updatedExercises,
          fitnessLevel: preset.fitnessLevel,
          numberOfDays: preset.numberOfDays
        };

        onSelectPreset(formattedPreset);
      }
    }
  };

  if (!visible) return null;

  return (
    <Card className="space-y-4 relative w-full">
      <button 
        onClick={() => setVisible(false)} 
        className="absolute top-2 right-2 text-red-500/70 hover:text-red-500 transition-colors z-10" 
        aria-label="Close workout presets"
      >
        <X size={20} />
      </button>

      <div className="text-center space-y-2 relative z-10 pt-4">
        <h3 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text">Starter Workouts</h3>
      </div>

      <Button 
        variant="outline" 
        className="w-full flex items-center justify-between bg-black/50 text-white border border-transparent relative z-10 overflow-hidden" 
        onClick={() => setShowPresets(!showPresets)}
      >
        <span className="text-sm sm:text-base truncate pr-2 relative z-10">Start with a pre-filled workout?</span>
        {showPresets ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </Button>

      {showPresets && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
          <p className="text-sm text-gray-300 text-center mb-4">
            Drawing from our database of thousands of user-submitted and expert-curated workouts, we've handpicked some 
            popular training templates to help you get started.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(WORKOUT_PROGRAMS).map(([category, workouts]) => (
              <Card key={category} className="p-4 bg-black/50 border-transparent relative overflow-hidden">
                <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
                <div className="absolute inset-[1px] bg-black/70 rounded-[calc(0.5rem-1px)]"></div>
                <div className="space-y-4 relative z-10">
                  <h4 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-center">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  
                  <Select 
                    value={selectedWorkouts[category] || ''} 
                    onValueChange={value => handleWorkoutSelect(category, value)}
                  >
                    <SelectTrigger className="w-full bg-black/60 text-white border-transparent relative overflow-hidden">
                      <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                      <div className="absolute inset-[1px] bg-black/70 rounded-[calc(0.375rem-1px)]"></div>
                      <SelectValue placeholder="Select a workout" className="relative z-10" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-transparent relative">
                      <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                      <div className="absolute inset-[1px] bg-black/95 rounded-[calc(0.375rem-1px)]"></div>
                      {Object.entries(workouts).map(([name, description]) => (
                        <TooltipProvider key={name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem value={name} className="text-white hover:bg-gradient-to-r hover:from-[#4CAF50]/10 hover:via-[#9C27B0]/10 hover:to-[#FF1493]/10 cursor-pointer relative z-10">
                                {name.replace(/_/g, ' ')}
                              </SelectItem>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[300px] bg-black/90 text-white p-3 border-transparent relative overflow-hidden">
                              <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                              <div className="absolute inset-[1px] bg-black/95 rounded-[calc(0.375rem-1px)]"></div>
                              <p className="relative z-10">{description}</p>
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
              <div className="bg-black p-6 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
                <div className="absolute inset-[1px] bg-black/95 rounded-[calc(0.5rem-1px)]"></div>
                <div className="flex items-center space-x-3 relative z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text" />
                  <p className="text-white">Analyzing workout and extracting exercises...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
