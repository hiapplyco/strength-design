
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ExerciseGenerationFormProps {
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  goals: string;
  setGoals: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ExerciseGenerationForm = ({
  fitnessLevel,
  setFitnessLevel,
  duration,
  setDuration,
  goals,
  setGoals,
  onGenerate,
  isGenerating
}: ExerciseGenerationFormProps) => {
  return (
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
        onClick={onGenerate}
        disabled={isGenerating || !fitnessLevel}
        className="w-full"
      >
        {isGenerating ? 'Generating...' : 'Generate Exercises'}
      </Button>
    </div>
  );
};
