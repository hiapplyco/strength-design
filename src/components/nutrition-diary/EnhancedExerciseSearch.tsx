
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Activity, Dumbbell, Clock, Flame } from 'lucide-react';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useAddExerciseEntry } from '@/hooks/useAddExerciseEntry';
import { useWorkoutToNutritionIntegration } from '@/hooks/useWorkoutToNutritionIntegration';

interface EnhancedExerciseSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mealGroup: string;
  date: Date;
}

export const EnhancedExerciseSearch: React.FC<EnhancedExerciseSearchProps> = ({
  isOpen,
  onOpenChange,
  mealGroup,
  date
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [duration, setDuration] = useState(30);
  
  const { workoutTemplates, isLoading } = useWorkoutTemplates();
  const { addExerciseEntry, isLoading: isAdding } = useAddExerciseEntry();
  const { extractExercisesFromWorkout } = useWorkoutToNutritionIntegration();

  // Extract exercises from all workout templates
  const templateExercises = workoutTemplates?.flatMap(template => {
    const exercises = extractExercisesFromWorkout(template.workout_data);
    return exercises.map(exercise => ({
      ...exercise,
      templateTitle: template.title,
      templateId: template.id
    }));
  }) || [];

  // Filter exercises based on search
  const filteredExercises = templateExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.templateTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExercise = async () => {
    if (!selectedExercise) return;

    try {
      await addExerciseEntry({
        exerciseName: selectedExercise.name,
        durationMinutes: duration,
        caloriesBurned: Math.round((selectedExercise.calories / selectedExercise.duration) * duration),
        mealGroup,
        date,
        workoutData: {
          description: selectedExercise.description,
          source: 'workout_template',
          templateTitle: selectedExercise.templateTitle
        }
      });
      
      onOpenChange(false);
      setSelectedExercise(null);
      setSearchQuery('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Enhanced Exercise Search
          </DialogTitle>
          <DialogDescription>
            Search from your workout templates or add custom exercises
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="templates" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">From Workouts</TabsTrigger>
              <TabsTrigger value="custom">Custom Exercise</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="flex-1 overflow-hidden space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search workout exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Exercise List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading workout templates...
                  </div>
                ) : filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise, index) => (
                    <Card 
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedExercise?.name === exercise.name ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{exercise.name}</CardTitle>
                        <CardDescription className="text-xs">
                          From: {exercise.templateTitle}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exercise.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {exercise.calories} cal
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No exercises found' : 'No workout templates available'}
                  </div>
                )}
              </div>

              {/* Exercise Configuration */}
              {selectedExercise && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Configure Exercise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                        min="1"
                        max="300"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estimated calories: {Math.round((selectedExercise.calories / selectedExercise.duration) * duration)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="custom" className="flex-1">
              <div className="text-center py-8 text-muted-foreground">
                Custom exercise entry coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddExercise}
            disabled={!selectedExercise || isAdding}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            {isAdding ? 'Adding...' : 'Add Exercise'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
