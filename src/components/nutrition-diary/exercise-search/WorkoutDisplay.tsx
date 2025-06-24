
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, AlertCircle } from 'lucide-react';

interface WorkoutDisplayProps {
  exercises: any[];
  selectedExercises: any[];
  onExerciseToggle: (exercise: any) => void;
  onContinueWithSelected: () => void;
}

export const WorkoutDisplay = ({ 
  exercises, 
  selectedExercises,
  onExerciseToggle,
  onContinueWithSelected
}: WorkoutDisplayProps) => {
  console.log('WorkoutDisplay received exercises:', exercises);

  const isExerciseSelected = (exercise: any) => {
    return selectedExercises.some(selected => selected.id === exercise.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Generated Exercises</h3>
        {selectedExercises.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedExercises.length} selected
          </span>
        )}
      </div>
      
      {exercises.length === 0 ? (
        <Card className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            No exercises were extracted from the workout. Please try generating again.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 max-h-60 overflow-y-auto">
            {exercises.map((exercise, index) => {
              const isSelected = isExerciseSelected(exercise);
              return (
                <Card 
                  key={exercise.id || index}
                  className={`p-4 cursor-pointer transition-colors border-l-4 ${
                    isSelected 
                      ? 'bg-muted/50 border-l-primary' 
                      : 'hover:bg-muted/50 border-l-primary/20 hover:border-l-primary'
                  }`}
                  onClick={() => onExerciseToggle(exercise)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onExerciseToggle(exercise)}
                        className="flex-shrink-0"
                      />
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
                    </div>
                    <Zap className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
          
          {selectedExercises.length > 0 && (
            <Button 
              onClick={onContinueWithSelected}
              className="w-full"
            >
              Continue with {selectedExercises.length} Selected Exercise{selectedExercises.length > 1 ? 's' : ''}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
