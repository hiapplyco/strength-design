
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, ChevronRight } from 'lucide-react';
import type { WeeklyWorkouts } from '@/types/fitness';
import { format } from 'date-fns';

interface WorkoutPreviewProps {
  generatedWorkout: WeeklyWorkouts | null;
  onReplaceWorkouts: () => void;
  isReplacing: boolean;
  existingWorkoutCount: number;
  onGoToGenerator: () => void;
}

export function WorkoutPreview({
  generatedWorkout,
  onReplaceWorkouts,
  isReplacing,
  existingWorkoutCount,
  onGoToGenerator,
}: WorkoutPreviewProps) {
  const getWorkoutDayExerciseCount = (workoutData: any): number => {
    if (!workoutData) return 0;
    
    // Check if it's a WorkoutDay with exercises array
    if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
      return workoutData.exercises.length;
    }
    
    // Check if it's a string description
    if (typeof workoutData === 'string') {
      return 1; // Assume 1 exercise for string descriptions
    }
    
    return 0;
  };

  if (!generatedWorkout) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No workout generated yet.</p>
        <Button 
          onClick={onGoToGenerator}
          variant="outline"
        >
          Go to Generator
        </Button>
      </div>
    );
  }

  const workoutDays = Object.keys(generatedWorkout).filter(key => key !== '_meta');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Workout Plan Overview</h3>
      <p className="text-muted-foreground">{generatedWorkout._meta?.summary}</p>

      <Separator />

      <h4 className="text-md font-semibold">Weekly Schedule</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workoutDays.map((day, index) => {
          const workoutData = generatedWorkout[day];
          const exerciseCount = getWorkoutDayExerciseCount(workoutData);
          
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{day.replace(/day(\d+)/, 'Day $1')}</CardTitle>
                <CardDescription>
                  {format(new Date(), 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {exerciseCount} Exercise{exerciseCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <div>
          <Badge variant="secondary">
            <Clock className="mr-2 h-4 w-4" />
            AI Powered
          </Badge>
        </div>
        <Button
          onClick={onReplaceWorkouts}
          disabled={isReplacing}
        >
          {isReplacing ? (
            <>
              Processing...
            </>
          ) : (
            <>
              Replace Workouts <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
