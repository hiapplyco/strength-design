
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutReplacementDialog } from '../WorkoutReplacementDialog';
import { WorkoutFormTabs } from './components/WorkoutFormTabs';
import { useModernWorkoutForm } from './hooks/useModernWorkoutForm';

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
    if (result !== false) { // If not explicitly false, consider it success
      onClose();
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AI Workout Generator</CardTitle>
          <CardDescription>
            Customize your workout plan with AI-powered suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
