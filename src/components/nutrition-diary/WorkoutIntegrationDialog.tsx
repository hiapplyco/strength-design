
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkoutToNutritionIntegration } from '@/hooks/useWorkoutToNutritionIntegration';
import type { WeeklyWorkouts } from '@/types/fitness';

interface WorkoutIntegrationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WeeklyWorkouts;
}

export const WorkoutIntegrationDialog: React.FC<WorkoutIntegrationDialogProps> = ({
  isOpen,
  onOpenChange,
  workout
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealGroup, setSelectedMealGroup] = useState('meal 1');
  const { addWorkoutToNutritionDiary, isAdding, extractExercisesFromWorkout } = useWorkoutToNutritionIntegration();

  const exercises = extractExercisesFromWorkout(workout);
  const workoutTitle = workout._meta?.title || 'Generated Workout';

  const handleAddToNutritionDiary = async () => {
    try {
      await addWorkoutToNutritionDiary(workout, selectedDate, selectedMealGroup);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Add Workout to Nutrition Diary
          </DialogTitle>
          <DialogDescription>
            Add "{workoutTitle}" exercises to your nutrition diary for tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workout Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{workoutTitle}</CardTitle>
              <CardDescription>
                {exercises.length} exercises will be added
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-muted-foreground">
                      {exercise.duration} min • {exercise.calories} cal
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          {/* Meal Group Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Meal Group</label>
            <Select value={selectedMealGroup} onValueChange={setSelectedMealGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meal 1">Meal 1</SelectItem>
                <SelectItem value="meal 2">Meal 2</SelectItem>
                <SelectItem value="meal 3">Meal 3</SelectItem>
                <SelectItem value="meal 4">Meal 4</SelectItem>
                <SelectItem value="meal 5">Meal 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToNutritionDiary}
              disabled={isAdding}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              {isAdding ? 'Adding...' : `Add ${exercises.length} Exercises`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
