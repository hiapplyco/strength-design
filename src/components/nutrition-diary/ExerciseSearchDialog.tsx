
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useAddExerciseEntry } from '@/hooks/useAddExerciseEntry';
import { ExerciseGenerationForm } from './exercise-search/ExerciseGenerationForm';
import { WorkoutDisplay } from './exercise-search/WorkoutDisplay';
import { ExerciseSelectionForm } from './exercise-search/ExerciseSelectionForm';
import { estimateCalories, extractExercisesFromWorkout } from './exercise-search/calorieEstimation';

interface ExerciseSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mealGroup: string;
  date: Date;
}

export const ExerciseSearchDialog = ({ isOpen, onOpenChange, mealGroup, date }: ExerciseSearchDialogProps) => {
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [duration, setDuration] = useState('30');
  const [goals, setGoals] = useState('');
  const [showWorkout, setShowWorkout] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [customCalories, setCustomCalories] = useState('');

  const { generateWorkout, isGenerating } = useWorkoutGeneration();
  const { addExerciseEntry, isLoading: isAdding } = useAddExerciseEntry();

  const handleGenerateExercises = async () => {
    if (!fitnessLevel) return;

    const prompt = `Generate a quick ${duration}-minute workout for someone with ${fitnessLevel} fitness level. Focus on: ${goals || 'general fitness'}. Include exercises with estimated calories burned.`;

    const result = await generateWorkout({
      prompt,
      weatherPrompt: '',
      selectedExercises: [],
      fitnessLevel,
      prescribedExercises: goals,
      numberOfDays: 1,
      numberOfCycles: 1
    });

    if (result) {
      setGeneratedWorkout(result);
      setShowWorkout(true);
    }
  };

  const handleSelectExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    // Estimate calories based on exercise type and duration
    const estimatedCalories = estimateCalories(exercise.name, parseInt(duration));
    setCustomCalories(estimatedCalories.toString());
  };

  const handleAddExercise = async () => {
    if (!selectedExercise) return;

    try {
      await addExerciseEntry({
        exerciseName: selectedExercise.name,
        durationMinutes: parseInt(duration),
        caloriesBurned: parseInt(customCalories) || 0,
        mealGroup,
        date,
        workoutData: selectedExercise
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const resetForm = () => {
    setFitnessLevel('');
    setDuration('30');
    setGoals('');
    setShowWorkout(false);
    setGeneratedWorkout(null);
    setSelectedExercise(null);
    setCustomCalories('');
  };

  const workoutExercises = generatedWorkout ? extractExercisesFromWorkout(generatedWorkout) : [];

  if (showWorkout && generatedWorkout) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowWorkout(false)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Select Exercise
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {selectedExercise ? (
              <ExerciseSelectionForm
                selectedExercise={selectedExercise}
                duration={duration}
                setDuration={setDuration}
                customCalories={customCalories}
                setCustomCalories={setCustomCalories}
                onAddExercise={handleAddExercise}
                onBack={() => setSelectedExercise(null)}
                isAdding={isAdding}
              />
            ) : (
              <WorkoutDisplay
                exercises={workoutExercises}
                onSelectExercise={handleSelectExercise}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Add Exercise
          </DialogTitle>
        </DialogHeader>
        
        <ExerciseGenerationForm
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
          duration={duration}
          setDuration={setDuration}
          goals={goals}
          setGoals={setGoals}
          onGenerate={handleGenerateExercises}
          isGenerating={isGenerating}
        />
      </DialogContent>
    </Dialog>
  );
};
