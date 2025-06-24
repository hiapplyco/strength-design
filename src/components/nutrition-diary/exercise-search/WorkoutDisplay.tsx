
import React from 'react';
import { Card } from '@/components/ui/card';
import { Zap, AlertCircle } from 'lucide-react';

interface WorkoutDisplayProps {
  exercises: any[];
  onSelectExercise: (exercise: any) => void;
}

export const WorkoutDisplay = ({ exercises, onSelectExercise }: WorkoutDisplayProps) => {
  console.log('WorkoutDisplay received exercises:', exercises);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Generated Exercises</h3>
      
      {exercises.length === 0 ? (
        <Card className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            No exercises were extracted from the workout. Please try generating again.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 max-h-60 overflow-y-auto">
          {exercises.map((exercise, index) => (
            <Card 
              key={exercise.id || index}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary/20 hover:border-l-primary"
              onClick={() => onSelectExercise(exercise)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-foreground">{exercise.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                      {exercise.type}
                    </span>
                    {exercise.description && (
                      <span className="ml-2">{exercise.description}</span>
                    )}
                  </div>
                </div>
                <Zap className="h-5 w-5 text-orange-500 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
