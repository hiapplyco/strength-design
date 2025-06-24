
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Dumbbell } from 'lucide-react';
import { ModernInputContainer } from './ModernInputContainer';
import { WorkoutPreview } from './WorkoutPreview';
import { GenerateWorkoutButton } from '../GenerateWorkoutButton';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
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
  const { config } = useWorkoutConfig();

  const handleGenerate = async () => {
    await handleGenerateWorkout({
      prompt: generatePrompt,
      weatherPrompt: config.weatherPrompt,
      selectedExercises: config.selectedExercises,
      fitnessLevel: config.fitnessLevel,
      prescribedExercises: config.prescribedExercises,
      injuries: config.injuries,
    });
  };

  return (
    <Tabs defaultValue="generator" className="space-y-6" value={selectedTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 h-11">
        <TabsTrigger 
          value="generator" 
          className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:border-green-500/30"
          disabled={isGenerating}
        >
          <Dumbbell className="h-4 w-4" />
          Workout Generator
        </TabsTrigger>
        <TabsTrigger 
          value="preview" 
          className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:border-green-500/30"
          disabled={isGenerating || !generatedWorkout}
        >
          <Calendar className="h-4 w-4" />
          Preview & Schedule
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="generator" className="space-y-4 mt-6">
        <ModernInputContainer
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          numberOfCycles={numberOfCycles}
          setNumberOfCycles={setNumberOfCycles}
          isGenerating={isGenerating}
        />
        
        <GenerateWorkoutButton
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </TabsContent>
      
      <TabsContent value="preview" className="mt-6">
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
