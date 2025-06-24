
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Dumbbell, Target, Clock, ChevronRight } from 'lucide-react';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useWorkoutReplacement } from '@/hooks/useWorkoutReplacement';
import { WorkoutReplacementDialog } from '../WorkoutReplacementDialog';
import type { WeeklyWorkouts } from '@/types/fitness';
import { format } from 'date-fns';

interface ModernWorkoutFormProps {
  onClose: () => void;
}

export const ModernWorkoutForm: React.FC<ModernWorkoutFormProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState('details');
  const [generatedWorkout, setGeneratedWorkout] = useState<WeeklyWorkouts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { generateWorkout } = useWorkoutGeneration();
  const { getScheduledWorkoutCount, replaceWorkouts, isReplacing } = useWorkoutReplacement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const existingWorkoutCount = getScheduledWorkoutCount();

  const handleGenerateWorkout = async () => {
    setIsLoading(true);
    try {
      const workout = await generateWorkout({
        numberOfDays: 5,
        numberOfCycles: 1,
        fitnessLevel: 'intermediate',
        weatherPrompt: '',
        prescribedExercises: '',
        injuries: '',
        prompt: 'Generate a balanced workout plan'
      });
      setGeneratedWorkout(workout);
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReplace = async () => {
    if (generatedWorkout) {
      const success = await replaceWorkouts(generatedWorkout);
      if (success) {
        setIsDialogOpen(false);
        onClose();
      }
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  const renderWorkoutDetails = () => {
    if (!generatedWorkout) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No workout generated yet.</p>
          <Button onClick={handleGenerateWorkout} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Workout'}
          </Button>
        </div>
      );
    }

    const workoutDays = Object.keys(generatedWorkout).filter(key => key !== '_meta');

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Workout Plan Overview</h3>
        <p className="text-muted-foreground">{generatedWorkout._meta?.summary}</p>

        <Separator />

        <h4 className="text-md font-semibold">Weekly Schedule</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workoutDays.map((day, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{day.replace(/day(\d+)/, 'Day $1')}</CardTitle>
                <CardDescription>
                  {format(new Date(), 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {generatedWorkout[day]?.exercises?.length || 0} Exercises
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AI Workout Generator</CardTitle>
          <CardDescription>
            Customize your workout plan with AI-powered suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="details" className="space-y-4" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Workout Details
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-2">
              {renderWorkoutDetails()}
            </TabsContent>
            <TabsContent value="schedule">
              <p className="text-muted-foreground">
                A visual representation of your workout schedule will be displayed here.
              </p>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <Badge variant="secondary">
                <Clock className="mr-2 h-4 w-4" />
                AI Powered
              </Badge>
            </div>
            <Button
              onClick={() => {
                if (existingWorkoutCount > 0) {
                  setIsDialogOpen(true);
                } else {
                  handleConfirmReplace();
                }
              }}
              disabled={isLoading || isReplacing || !generatedWorkout}
            >
              {isLoading || isReplacing ? (
                <>
                  Generating...
                </>
              ) : (
                <>
                  Replace Workouts <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkoutReplacementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newWorkout={generatedWorkout || {} as WeeklyWorkouts}
        existingWorkoutCount={existingWorkoutCount}
        onConfirmReplace={handleConfirmReplace}
        onCancel={handleCancel}
      />
    </div>
  );
};
