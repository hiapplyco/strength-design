
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ExerciseSelectionFormProps {
  selectedExercise: any;
  duration: string;
  setDuration: (value: string) => void;
  customCalories: string;
  setCustomCalories: (value: string) => void;
  onAddExercise: () => void;
  onBack: () => void;
  isAdding: boolean;
}

export const ExerciseSelectionForm = ({
  selectedExercise,
  duration,
  setDuration,
  customCalories,
  setCustomCalories,
  onAddExercise,
  onBack,
  isAdding
}: ExerciseSelectionFormProps) => {
  return (
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
          onClick={onAddExercise}
          disabled={isAdding}
          className="flex-1"
        >
          {isAdding ? 'Adding...' : 'ADD TO DIARY'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
};
