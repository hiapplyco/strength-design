
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Dumbbell } from 'lucide-react';
import { InputContainer } from '../../input-container';
import { WorkoutPreview } from './WorkoutPreview';
import type { WeeklyWorkouts } from '@/types/fitness';
import type { Exercise } from '@/components/exercise-search/types';

interface WorkoutFormTabsProps {
  selectedTab: string;
  onTabChange: (value: string) => void;
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
    injuries?: string;
  }) => Promise<void>;
  isGenerating: boolean;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  numberOfCycles: number;
  setNumberOfCycles: (value: number) => void;
  generatedWorkout: WeeklyWorkouts | null;
  onReplaceWorkouts: () => void;
  isReplacing: boolean;
  existingWorkoutCount: number;
}

export function WorkoutFormTabs({
  selectedTab,
  onTabChange,
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  numberOfDays,
  setNumberOfDays,
  numberOfCycles,
  setNumberOfCycles,
  generatedWorkout,
  onReplaceWorkouts,
  isReplacing,
  existingWorkoutCount,
}: WorkoutFormTabsProps) {
  return (
    <Tabs defaultValue="generator" className="space-y-4" value={selectedTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="generator" className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Workout Generator
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Preview & Schedule
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="generator" className="space-y-2">
        <InputContainer
          generatePrompt={generatePrompt}
          setGeneratePrompt={setGeneratePrompt}
          handleGenerateWorkout={handleGenerateWorkout}
          isGenerating={isGenerating}
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          numberOfCycles={numberOfCycles}
          setNumberOfCycles={setNumberOfCycles}
        />
      </TabsContent>
      
      <TabsContent value="preview">
        <WorkoutPreview
          generatedWorkout={generatedWorkout}
          onReplaceWorkouts={onReplaceWorkouts}
          isReplacing={isReplacing}
          existingWorkoutCount={existingWorkoutCount}
          onGoToGenerator={() => onTabChange('generator')}
        />
      </TabsContent>
    </Tabs>
  );
}
