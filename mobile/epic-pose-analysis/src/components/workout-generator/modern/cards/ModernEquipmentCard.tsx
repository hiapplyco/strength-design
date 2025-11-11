
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';
import { ExerciseSearch } from '@/components/ExerciseSearch';
import { ModernInputCard } from '../components/ModernInputCard';
import type { Exercise } from '@/components/exercise-search/types';

interface ModernEquipmentCardProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ModernEquipmentCard: React.FC<ModernEquipmentCardProps> = ({
  selectedExercises,
  onExerciseSelect,
  isExpanded,
  onToggle
}) => {
  const handleExerciseSelect = (exercise: Exercise) => {
    onExerciseSelect(exercise);
  };

  const handleExercisesSelect = (exercises: Exercise[]) => {
    exercises.forEach(exercise => {
      onExerciseSelect(exercise);
    });
  };

  const getPreview = () => {
    if (selectedExercises.length === 0) return undefined;
    return `${selectedExercises.length} item${selectedExercises.length !== 1 ? 's' : ''}`;
  };

  return (
    <ModernInputCard
      icon={<Dumbbell className="h-5 w-5" />}
      title="Available Equipment"
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={selectedExercises.length > 0}
      preview={getPreview()}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select the equipment and exercises you have access to
        </p>
        
        <ExerciseSearch 
          onExerciseSelect={handleExerciseSelect}
          onExercisesSelect={handleExercisesSelect}
          selectedExercises={selectedExercises}
        />
        
        {selectedExercises.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Selected Equipment ({selectedExercises.length}):
              </label>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-muted/30 rounded-md">
              {selectedExercises.map((exercise) => (
                <Badge 
                  key={exercise.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20"
                  onClick={() => handleExerciseSelect(exercise)}
                >
                  {exercise.name} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModernInputCard>
  );
};
