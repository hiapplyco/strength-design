
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKOUT_PROGRAMS, PRESET_CONFIGS } from '../constants/workoutPresets';
import { useGeminiExerciseExtraction } from '../hooks/useGeminiExerciseExtraction';
import { useTheme } from "@/contexts/ThemeContext";
import type { Exercise } from "@/components/exercise-search/types";
import { cn } from "@/lib/utils";
import { PresetCard } from './presets/PresetCard';
import { LoadingOverlay } from './presets/LoadingOverlay';

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
  const { isExtracting } = useGeminiExerciseExtraction();

  const handleWorkoutSelect = async (category: string, workoutName: string) => {
    const preset = PRESET_CONFIGS[workoutName as keyof typeof PRESET_CONFIGS];
    if (!preset) return;

    setSelectedWorkouts({
      [category]: workoutName
    });
    
    const categoryKey = Object.keys(WORKOUT_PROGRAMS).find(cat => 
      Object.keys(WORKOUT_PROGRAMS[cat as keyof typeof WORKOUT_PROGRAMS]).includes(workoutName)
    ) as keyof typeof WORKOUT_PROGRAMS | undefined;
    
    if (!categoryKey) return;

    const workoutDescription = WORKOUT_PROGRAMS[categoryKey][workoutName as keyof (typeof WORKOUT_PROGRAMS)[typeof categoryKey]];
    const newWorkoutContent = `${preset.title}\n\nDescription:\n${workoutDescription}\n\nWorkout Details:\n${preset.prescribedExercises}`;
    const updatedExercises = currentPrescribedExercises 
      ? `${currentPrescribedExercises}\n\n------ NEW WORKOUT ------\n\n${newWorkoutContent}`
      : newWorkoutContent;
    
    onSelectPreset({
      title: preset.title,
      prescribedExercises: updatedExercises,
      fitnessLevel: preset.fitnessLevel,
      numberOfDays: preset.numberOfDays
    });
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
        <h3 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text">
          Starter Workouts
        </h3>
      </div>

      <Button 
        variant="outline" 
        className={cn(
          "w-full flex items-center justify-between relative z-10 overflow-hidden",
          theme === 'light' 
            ? 'bg-white/70 text-gray-800 border border-gray-200' 
            : 'bg-black/50 text-white border border-transparent'
        )}
        onClick={() => setShowPresets(!showPresets)}
      >
        <span className="text-sm sm:text-base truncate pr-2 relative z-10">
          Start with a pre-filled workout?
        </span>
        {showPresets ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </Button>

      {showPresets && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
          <p className={cn(
            "text-sm text-center mb-4",
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          )}>
            Drawing from our database of thousands of user-submitted and expert-curated workouts, we've handpicked some 
            popular training templates to help you get started.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(WORKOUT_PROGRAMS).map(([category, workouts]) => (
              <PresetCard
                key={category}
                category={category}
                workouts={workouts}
                selectedWorkout={selectedWorkouts[category] || ''}
                onSelect={handleWorkoutSelect}
              />
            ))}
          </div>

          {isExtracting && <LoadingOverlay />}
        </div>
      )}
    </Card>
  );
}
