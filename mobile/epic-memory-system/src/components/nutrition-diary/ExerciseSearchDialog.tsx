
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useAddExerciseEntry } from '@/hooks/useAddExerciseEntry';
import { ExerciseGenerationForm } from './exercise-search/ExerciseGenerationForm';
import { WorkoutDisplay } from './exercise-search/WorkoutDisplay';
import { MultiExerciseConfigForm } from './exercise-search/MultiExerciseConfigForm';
import { estimateCalories, extractExercisesFromWorkout } from './exercise-search/calorieEstimation';

interface ExerciseConfig {
  exercise: any;
  duration: string;
  calories: string;
}

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
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [exerciseConfigs, setExerciseConfigs] = useState<ExerciseConfig[]>([]);

  const { generateWorkout, isGenerating } = useWorkoutGeneration();
  const { addExerciseEntry, isLoading: isAdding } = useAddExerciseEntry();

  const handleGenerateExercises = async () => {
    if (!fitnessLevel) return;

    console.log('Generating exercises with params:', { fitnessLevel, duration, goals });

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

    console.log('Workout generation result:', result);

    if (result) {
      setGeneratedWorkout(result);
      setSelectedExercises([]);
      setShowWorkout(true);
    }
  };

  const handleExerciseToggle = (exercise: any) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(selected => selected.id === exercise.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleContinueWithSelected = () => {
    const configs = selectedExercises.map(exercise => ({
      exercise,
      duration: duration,
      calories: estimateCalories(exercise.name, parseInt(duration)).toString()
    }));
    setExerciseConfigs(configs);
    setShowConfig(true);
  };

  const handleUpdateConfig = (index: number, field: 'duration' | 'calories', value: string) => {
    setExerciseConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  };

  const handleRemoveExercise = (index: number) => {
    setExerciseConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAll = async () => {
    try {
      for (const config of exerciseConfigs) {
        await addExerciseEntry({
          exerciseName: config.exercise.name,
          durationMinutes: parseInt(config.duration),
          caloriesBurned: parseInt(config.calories) || 0,
          mealGroup,
          date,
          workoutData: config.exercise
        });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding exercises:', error);
    }
  };

  const resetForm = () => {
    setFitnessLevel('');
    setDuration('30');
    setGoals('');
    setShowWorkout(false);
    setGeneratedWorkout(null);
    setSelectedExercises([]);
    setShowConfig(false);
    setExerciseConfigs([]);
  };

  const handleBack = () => {
    if (showConfig) {
      setShowConfig(false);
    } else {
      setShowWorkout(false);
    }
  };

  const workoutExercises = generatedWorkout ? extractExercisesFromWorkout(generatedWorkout) : [];
  console.log('Workout exercises for display:', workoutExercises);

  if (showWorkout && generatedWorkout) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {showConfig ? 'Configure Exercises' : 'Select Exercises'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {showConfig ? (
              <MultiExerciseConfigForm
                exerciseConfigs={exerciseConfigs}
                onUpdateConfig={handleUpdateConfig}
                onRemoveExercise={handleRemoveExercise}
                onAddAll={handleAddAll}
                onBack={handleBack}
                isAdding={isAdding}
              />
            ) : (
              <WorkoutDisplay
                exercises={workoutExercises}
                selectedExercises={selectedExercises}
                onExerciseToggle={handleExerciseToggle}
                onContinueWithSelected={handleContinueWithSelected}
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
