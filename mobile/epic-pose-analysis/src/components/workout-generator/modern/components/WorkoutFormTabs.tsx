
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Dumbbell } from 'lucide-react';
import { ModernInputContainer } from './ModernInputContainer';
import { WorkoutPreview } from './WorkoutPreview';
import ProgramFinder, { type FitnessProgram } from '../../ProgramFinder';
import { GenerateWorkoutButton } from '../GenerateWorkoutButton';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import type { WeeklyWorkouts } from '@/types/fitness';
import type { Exercise } from '@/components/exercise-search/types';
import { toast } from 'sonner';

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
  const { config, updateConfig } = useWorkoutConfig();

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

  const handleSelectProgram = (program: FitnessProgram) => {
    // Extract equipment from the program
    const equipmentList = program.equipment.join(', ');
    
    // Extract goals from the program
    const goalsList = program.goals.join(', ');
    
    // Build a program description for the prescribed exercises field
    const programDescription = `${program.programName}: ${program.description}\n\nGoals: ${goalsList}\nLevel: ${program.level}\nDuration: ${program.duration}\nFrequency: ${program.frequency}`;
    
    // Extract average workout days per week from frequency
    let workoutDays = 3; // default
    const frequencyMatch = program.frequency.match(/(\d+)/);
    if (frequencyMatch) {
      workoutDays = parseInt(frequencyMatch[1]);
    }
    
    // Update workout configuration
    updateConfig({
      fitnessLevel: program.level.toLowerCase(),
      prescribedExercises: programDescription,
      numberOfDays: workoutDays,
    });
    
    // Update generate prompt with program info
    setGeneratePrompt(`Generate a ${program.programName} style workout program. ${program.description}`);
    
    toast.success(`${program.programName} loaded! You can now customize and generate your workout.`);
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
        
        <ProgramFinder onSelectProgram={handleSelectProgram} />
        
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
