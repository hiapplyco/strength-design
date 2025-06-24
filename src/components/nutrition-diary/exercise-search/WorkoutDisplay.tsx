
import React from 'react';
import { Card } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface WorkoutDisplayProps {
  exercises: any[];
  onSelectExercise: (exercise: any) => void;
}

export const WorkoutDisplay = ({ exercises, onSelectExercise }: WorkoutDisplayProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Generated Exercises</h3>
      <div className="grid gap-2 max-h-60 overflow-y-auto">
        {exercises.map((exercise, index) => (
          <Card 
            key={index}
            className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectExercise(exercise)}
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
  );
};
