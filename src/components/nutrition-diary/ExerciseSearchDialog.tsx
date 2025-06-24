
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Dumbbell, Zap } from 'lucide-react';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useAddExerciseEntry } from '@/hooks/useAddExerciseEntry';
import { Card } from '@/components/ui/card';

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
      numberOfDays: 1
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

  const estimateCalories = (exerciseName: string, minutes: number): number => {
    // Simple calorie estimation based on exercise type
    const caloriesPerMinute: { [key: string]: number } = {
      'running': 10,
      'cycling': 8,
      'swimming': 9,
      'walking': 4,
      'yoga': 3,
      'weightlifting': 6,
      'cardio': 8,
      'strength': 6,
      'hiit': 12,
      'default': 5
    };

    const exerciseType = Object.keys(caloriesPerMinute).find(type => 
      exerciseName.toLowerCase().includes(type)
    ) || 'default';

    return caloriesPerMinute[exerciseType] * minutes;
  };

  const extractExercisesFromWorkout = (workout: any) => {
    const exercises: any[] = [];
    
    if (workout.days && workout.days.length > 0) {
      const day = workout.days[0];
      
      // Extract from warmup
      if (day.warmup) {
        const warmupExercises = day.warmup.match(/\d+\.\s*([^:\n]+)/g) || [];
        warmupExercises.forEach((exercise: string) => {
          const name = exercise.replace(/\d+\.\s*/, '').trim();
          exercises.push({ name, type: 'warmup', description: name });
        });
      }

      // Extract from main workout
      if (day.workout) {
        const workoutExercises = day.workout.match(/\d+\.\s*([^:\n]+)/g) || [];
        workoutExercises.forEach((exercise: string) => {
          const name = exercise.replace(/\d+\.\s*/, '').trim();
          exercises.push({ name, type: 'main', description: name });
        });
      }
    }

    return exercises;
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
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold">{selectedExercise.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedExercise.description}</p>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calories">Calories Burned</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddExercise}
                    disabled={isAdding}
                    className="flex-1"
                  >
                    {isAdding ? 'Adding...' : 'ADD TO DIARY'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedExercise(null)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Generated Exercises</h3>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {workoutExercises.map((exercise, index) => (
                    <Card 
                      key={index}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{exercise.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({exercise.type})
                          </span>
                        </div>
                        <Zap className="h-4 w-4 text-orange-500" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
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
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="fitness-level">Fitness Level</Label>
            <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select fitness level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1"
              min="5"
              max="120"
            />
          </div>

          <div>
            <Label htmlFor="goals">Goals/Focus (optional)</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g., cardio, strength, flexibility, weight loss..."
              className="mt-1"
              rows={2}
            />
          </div>

          <Button 
            onClick={handleGenerateExercises}
            disabled={isGenerating || !fitnessLevel}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Exercises'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
