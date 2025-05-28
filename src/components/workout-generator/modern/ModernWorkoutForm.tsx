
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { User, Target, Calendar, MapPin, AlertTriangle, Dumbbell } from 'lucide-react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { ExerciseSearch } from '@/components/ExerciseSearch';
import type { Exercise } from '@/components/exercise-search/types';

export const ModernWorkoutForm: React.FC = () => {
  const { config, updateConfig } = useWorkoutConfig();

  const handleExerciseSelect = (exercise: Exercise) => {
    const isSelected = config.selectedExercises.some(e => e.id === exercise.id);
    if (isSelected) {
      updateConfig({
        selectedExercises: config.selectedExercises.filter(e => e.id !== exercise.id)
      });
    } else {
      updateConfig({
        selectedExercises: [...config.selectedExercises, exercise]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Fitness Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Fitness Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={config.fitnessLevel}
            onValueChange={(value) => updateConfig({ fitnessLevel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your fitness level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
              <SelectItem value="intermediate">Intermediate (6+ months)</SelectItem>
              <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
              <SelectItem value="expert">Expert (5+ years)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe your fitness goals, preferred workout style, or any specific requirements..."
            value={config.prescribedExercises}
            onChange={(e) => updateConfig({ prescribedExercises: e.target.value })}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Training Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Days per cycle: {config.numberOfDays}
            </label>
            <Slider
              value={[config.numberOfDays]}
              onValueChange={([value]) => updateConfig({ numberOfDays: value })}
              min={1}
              max={7}
              step={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Number of cycles: {config.numberOfCycles}
            </label>
            <Slider
              value={[config.numberOfCycles]}
              onValueChange={([value]) => updateConfig({ numberOfCycles: value })}
              min={1}
              max={4}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment & Exercises */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dumbbell className="h-4 w-4 text-primary" />
            Available Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExerciseSearch 
            onExerciseSelect={handleExerciseSelect}
            selectedExercises={config.selectedExercises}
          />
          {config.selectedExercises.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Equipment:</label>
              <div className="flex flex-wrap gap-2">
                {config.selectedExercises.map((exercise) => (
                  <Badge 
                    key={exercise.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
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

      {/* Injuries & Limitations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Injuries & Limitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any injuries, physical limitations, or exercises to avoid..."
            value={config.injuries}
            onChange={(e) => updateConfig({ injuries: e.target.value })}
            className="min-h-[80px] resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
};
