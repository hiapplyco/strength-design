
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, MessageSquare } from 'lucide-react';
import { ExerciseSearch } from '@/components/ExerciseSearch';
import type { Exercise } from '@/components/exercise-search/types';

interface EquipmentCardProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  selectedExercises,
  onExerciseSelect
}) => {
  const handleExerciseSelect = (exercise: Exercise) => {
    console.log('EquipmentCard: Individual exercise selection:', exercise.name);
    // This will toggle the exercise - add if not selected, remove if selected
    onExerciseSelect(exercise);
  };

  const handleExercisesSelect = (exercises: Exercise[]) => {
    console.log('EquipmentCard: Bulk exercise selection:', exercises.length, 'exercises');
    exercises.forEach(exercise => {
      console.log('EquipmentCard: Adding exercise:', exercise.name);
      onExerciseSelect(exercise);
    });
  };

  return (
    <Card className={`transition-colors duration-300 ${selectedExercises.length > 0 ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Dumbbell className="h-4 w-4 text-primary" />
          Available Equipment
          {selectedExercises.length > 0 && <MessageSquare className="h-3 w-3 text-primary opacity-60" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ExerciseSearch 
          onExerciseSelect={handleExerciseSelect}
          onExercisesSelect={handleExercisesSelect}
          selectedExercises={selectedExercises}
        />
        {selectedExercises.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selected Equipment ({selectedExercises.length}):
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedExercises.map((exercise) => (
                <Badge 
                  key={exercise.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs"
                  onClick={() => handleExerciseSelect(exercise)}
                >
                  {exercise.name} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
