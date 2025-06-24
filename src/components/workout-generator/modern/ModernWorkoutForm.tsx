
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
import { InputContainer } from '../input-container';
import type { WeeklyWorkouts } from '@/types/fitness';
import type { Exercise } from '@/components/exercise-search/types';
import { format } from 'date-fns';

interface ModernWorkoutFormProps {
  onClose: () => void;
}

export const ModernWorkoutForm: React.FC<ModernWorkoutFormProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState('generator');
  const [generatedWorkout, setGeneratedWorkout] = useState<WeeklyWorkouts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(5);
  const [numberOfCycles, setNumberOfCycles] = useState(1);
  const [generatePrompt, setGeneratePrompt] = useState('');
  
  const { generateWorkout } = useWorkoutGeneration();
  const { getScheduledWorkoutCount, replaceWorkouts, isReplacing } = useWorkoutReplacement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const existingWorkoutCount = getScheduledWorkoutCount();

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
    injuries?: string;
  }) => {
    setIsGenerating(true);
    try {
      const workout = await generateWorkout({
        numberOfDays,
        numberOfCycles,
        fitnessLevel: params.fitnessLevel,
        weatherPrompt: params.weatherPrompt,
        prescribedExercises: params.prescribedExercises,
        injuries: params.injuries,
        prompt: params.prompt,
        selectedExercises: params.selectedExercises
      });
      
      if (workout) {
        setGeneratedWorkout(workout);
        setSelectedTab('preview');
      }
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setIsGenerating(false);
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

  const getWorkoutDayExerciseCount = (workoutData: any): number => {
    if (!workoutData) return 0;
    
    // Check if it's a WorkoutDay with exercises array
    if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
      return workoutData.exercises.length;
    }
    
    // Check if it's a string description
    if (typeof workoutData === 'string') {
      return 1; // Assume 1 exercise for string descriptions
    }
    
    return 0;
  };

  const renderWorkoutPreview = () => {
    if (!generatedWorkout) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No workout generated yet.</p>
          <Button 
            onClick={() => setSelectedTab('generator')}
            variant="outline"
          >
            Go to Generator
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
          {workoutDays.map((day, index) => {
            const workoutData = generatedWorkout[day];
            const exerciseCount = getWorkoutDayExerciseCount(workoutData);
            
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{day.replace(/day(\d+)/, 'Day $1')}</CardTitle>
                  <CardDescription>
                    {format(new Date(), 'MMMM dd, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {exerciseCount} Exercise{exerciseCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
            disabled={isGenerating || isReplacing}
          >
            {isGenerating || isReplacing ? (
              <>
                Processing...
              </>
            ) : (
              <>
                Replace Workouts <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
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
          <Tabs defaultValue="generator" className="space-y-4" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Workout Generator
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Preview & Schedule
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="generator" className="space-y-2">
              <InputContainer
                generatePrompt={generatePrompt}
                setGeneratePrompt={setGeneratePrompt}
                handleGenerateWorkout={handleGenerateWorkout}
                isGenerating={isGenerating}
                numberOfDays={numberOfDays}
                setNumberOfDays={setNumberOfDays}
                numberOfCycles={numberOfCycles}
                setNumberOfCycles={setNumberOfCycles}
              />
            </TabsContent>
            
            <TabsContent value="preview">
              {renderWorkoutPreview()}
            </TabsContent>
          </Tabs>
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
