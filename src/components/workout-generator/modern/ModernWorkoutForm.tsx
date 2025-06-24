
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutReplacementDialog } from '../WorkoutReplacementDialog';
import { WorkoutFormTabs } from './components/WorkoutFormTabs';
import { useModernWorkoutForm } from './hooks/useModernWorkoutForm';
import type { WeeklyWorkouts } from '@/types/fitness';

interface ModernWorkoutFormProps {
  onClose: () => void;
}

export const ModernWorkoutForm: React.FC<ModernWorkoutFormProps> = ({ onClose }) => {
  const {
    selectedTab,
    setSelectedTab,
    generatedWorkout,
    isGenerating,
    numberOfDays,
    setNumberOfDays,
    numberOfCycles,
    setNumberOfCycles,
    generatePrompt,
    setGeneratePrompt,
    isDialogOpen,
    setIsDialogOpen,
    existingWorkoutCount,
    isReplacing,
    handleGenerateWorkout,
    handleConfirmReplace,
    handleReplaceWorkouts,
    handleCancel,
  } = useModernWorkoutForm();

  // Update handleConfirmReplace to include onClose
  const handleConfirmReplaceWithClose = async () => {
    const result = await handleConfirmReplace();
    if (result) {
      onClose();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <CardTitle className="text-2xl bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              AI Workout Generator
            </CardTitle>
          </div>
          <CardDescription className="text-base text-muted-foreground">
            Customize your workout plan with AI-powered suggestions tailored to your goals and equipment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          <WorkoutFormTabs
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            generatePrompt={generatePrompt}
            setGeneratePrompt={setGeneratePrompt}
            handleGenerateWorkout={handleGenerateWorkout}
            isGenerating={isGenerating}
            numberOfDays={numberOfDays}
            setNumberOfDays={setNumberOfDays}
            numberOfCycles={numberOfCycles}
            setNumberOfCycles={setNumberOfCycles}
            generatedWorkout={generatedWorkout}
            onReplaceWorkouts={handleReplaceWorkouts}
            isReplacing={isReplacing}
            existingWorkoutCount={existingWorkoutCount}
          />
        </CardContent>
      </Card>

      <WorkoutReplacementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newWorkout={generatedWorkout || {} as WeeklyWorkouts}
        existingWorkoutCount={existingWorkoutCount}
        onConfirmReplace={handleConfirmReplaceWithClose}
        onCancel={handleCancel}
      />
    </div>
  );
};
