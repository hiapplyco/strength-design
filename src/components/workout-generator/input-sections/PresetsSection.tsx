
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { WORKOUT_PROGRAMS, PRESET_CONFIGS } from '../constants/workoutPresets';
import { useGeminiExerciseExtraction } from '../hooks/useGeminiExerciseExtraction';
import { useTheme } from "@/contexts/ThemeContext";
import type { Exercise } from "../exercise-search/types";
import { cn } from "@/lib/utils";

interface PresetsProps {
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
}: PresetsProps) {
  const [selectedWorkouts, setSelectedWorkouts] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState(false);
  const [visible, setVisible] = useState(true);
  const { theme } = useTheme();
  
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
        className={`w-full flex items-center justify-between relative z-10 overflow-hidden ${
          theme === 'light' 
            ? 'bg-white/70 text-gray-800 border border-gray-200' 
            : 'bg-black/50 text-white border border-transparent'
        }`}
        onClick={() => setShowPresets(!showPresets)}
      >
        <span className="text-sm sm:text-base truncate pr-2 relative z-10">Start with a pre-filled workout?</span>
        {showPresets ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </Button>

      {showPresets && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
          <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-center mb-4`}>
            Drawing from our database of thousands of user-submitted and expert-curated workouts, we've handpicked some 
            popular training templates to help you get started.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(WORKOUT_PROGRAMS).map(([category, workouts]) => (
              <Card key={category} className={`p-4 relative overflow-hidden ${
                theme === 'light' 
                  ? 'bg-white/70 border-gray-200' 
                  : 'bg-black/50 border-transparent'
              }`}>
                <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
                <div className={`absolute inset-[1px] rounded-[calc(0.5rem-1px)] ${
                  theme === 'light' 
                    ? 'bg-white/90' 
                    : 'bg-black/70'
                }`}></div>
                <div className="space-y-4 relative z-10">
                  <h4 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-center">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  
                  <Select 
                    value={selectedWorkouts[category] || ''} 
                    onValueChange={value => handleWorkoutSelect(category, value)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "w-full relative overflow-hidden",
                        theme === 'light' 
                          ? 'bg-white/80 text-gray-800 border-gray-200 placeholder:text-gray-500' 
                          : 'bg-black/60 text-white border-transparent'
                      )}
                    >
                      <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                      <div className={`absolute inset-[1px] rounded-[calc(0.375rem-1px)] ${
                        theme === 'light' 
                          ? 'bg-white/90' 
                          : 'bg-black/70'
                      }`}></div>
                      <SelectValue 
                        placeholder="Select a workout" 
                        className={cn(
                          "relative z-10",
                          theme === 'light' 
                            ? 'text-gray-600' 
                            : 'text-gray-300'
                        )} 
                      />
                    </SelectTrigger>
                    <SelectContent 
                      className={cn(
                        "relative",
                        theme === 'light' 
                          ? 'bg-white/95 border-gray-200' 
                          : 'bg-black/95 border-transparent'
                      )}
                    >
                      <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                      <div className={`absolute inset-[1px] rounded-[calc(0.375rem-1px)] ${
                        theme === 'light' 
                          ? 'bg-white/95' 
                          : 'bg-black/95'
                      }`}></div>
                      {Object.entries(workouts).map(([name, description]) => (
                        <TooltipProvider key={name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem 
                                value={name} 
                                className={cn(
                                  "cursor-pointer relative z-10",
                                  theme === 'light'
                                    ? 'text-gray-800 hover:bg-gradient-to-r hover:from-[#4CAF50]/5 hover:via-[#9C27B0]/5 hover:to-[#FF1493]/5 placeholder:text-gray-600' 
                                    : 'text-white hover:bg-gradient-to-r hover:from-[#4CAF50]/10 hover:via-[#9C27B0]/10 hover:to-[#FF1493]/10'
                                )}
                              >
                                {name.replace(/_/g, ' ')}
                              </SelectItem>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right" 
                              className={cn(
                                "max-w-[300px] p-3 border-transparent relative overflow-hidden",
                                theme === 'light' 
                                  ? 'bg-white/90 text-gray-800' 
                                  : 'bg-black/90 text-white'
                              )}
                            >
                              <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-md"></div>
                              <div className={`absolute inset-[1px] rounded-[calc(0.375rem-1px)] ${
                                theme === 'light' 
                                  ? 'bg-white/95' 
                                  : 'bg-black/95'
                              }`}></div>
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
        </div>
      )}
    </Card>
  );
}

