
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface ExerciseConfig {
  exercise: any;
  duration: string;
  calories: string;
}

interface MultiExerciseConfigFormProps {
  exerciseConfigs: ExerciseConfig[];
  onUpdateConfig: (index: number, field: 'duration' | 'calories', value: string) => void;
  onRemoveExercise: (index: number) => void;
  onAddAll: () => void;
  onBack: () => void;
  isAdding: boolean;
}

export const MultiExerciseConfigForm = ({
  exerciseConfigs,
  onUpdateConfig,
  onRemoveExercise,
  onAddAll,
  onBack,
  isAdding
}: MultiExerciseConfigFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Configure Selected Exercises</h3>
        <span className="text-sm text-muted-foreground">
          {exerciseConfigs.length} exercise{exerciseConfigs.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {exerciseConfigs.map((config, index) => (
          <Card key={config.exercise.id || index} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{config.exercise.name}</h4>
                  <p className="text-sm text-muted-foreground">{config.exercise.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveExercise(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`duration-${index}`} className="text-xs">
                    Duration (minutes)
                  </Label>
                  <Input
                    id={`duration-${index}`}
                    type="number"
                    value={config.duration}
                    onChange={(e) => onUpdateConfig(index, 'duration', e.target.value)}
                    className="mt-1"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor={`calories-${index}`} className="text-xs">
                    Calories Burned
                  </Label>
                  <Input
                    id={`calories-${index}`}
                    type="number"
                    value={config.calories}
                    onChange={(e) => onUpdateConfig(index, 'calories', e.target.value)}
                    className="mt-1"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={onAddAll}
          disabled={isAdding || exerciseConfigs.length === 0}
          className="flex-1"
        >
          {isAdding ? 'Adding...' : `ADD ALL ${exerciseConfigs.length} TO DIARY`}
        </Button>
        <Button 
          variant="outline" 
          onClick={onBack}
          disabled={isAdding}
        >
          Back
        </Button>
      </div>
    </div>
  );
};
