import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { WorkoutDisplay } from './WorkoutDisplay';
import { Dumbbell, Zap } from 'lucide-react';

export function GenerateWorkoutContainer() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [workoutData, setWorkoutData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [workoutLength, setWorkoutLength] = useState(30);
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [workoutGoal, setWorkoutGoal] = useState('');
  const [equipment, setEquipment] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const { toast } = useToast();

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setWorkoutData(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutLength,
          fitnessLevel,
          workoutGoal,
          equipment,
          additionalInfo
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.workout) {
        throw new Error('No workout data received');
      }

      setWorkoutData(data.workout);
      toast({
        title: "Workout Generated",
        description: "Your custom workout has been created successfully!",
      });
    } catch (error: any) {
      console.error("Error generating workout:", error);
      setErrorMessage(error?.message || "Failed to generate workout. Please try again.");
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutData) return;

    try {
      const { error } = await supabase
        .from('saved_workouts')
        .insert({
          workout_data: workoutData,
          workout_length: workoutLength,
          fitness_level: fitnessLevel,
          workout_goal: workoutGoal,
          equipment: equipment,
          additional_info: additionalInfo
        });

      if (error) throw error;

      toast({
        title: "Workout Saved",
        description: "Your workout has been saved to your profile.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMessage(error?.message || "An error occurred. Please try again.");
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black/30 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Workout Generator</CardTitle>
          <CardDescription>
            Create a personalized workout based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Generate Workout
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2" disabled={!workoutData}>
                <Dumbbell className="h-4 w-4" />
                View Workout
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workoutLength">Workout Length (minutes)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      id="workoutLength"
                      min={10}
                      max={90}
                      step={5}
                      value={[workoutLength]}
                      onValueChange={(value) => setWorkoutLength(value[0])}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{workoutLength}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="fitnessLevel">Fitness Level</Label>
                  <select
                    id="fitnessLevel"
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value)}
                    className="w-full p-2 rounded-md bg-black/50 border border-gray-700 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="workoutGoal">Workout Goal</Label>
                  <Input
                    id="workoutGoal"
                    placeholder="e.g., Strength, Cardio, Weight Loss"
                    value={workoutGoal}
                    onChange={(e) => setWorkoutGoal(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="equipment">Available Equipment</Label>
                  <Input
                    id="equipment"
                    placeholder="e.g., Dumbbells, Resistance Bands, None"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any injuries, preferences, or specific needs"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                {errorMessage && (
                  <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">
                    {errorMessage}
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateWorkout} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <LoadingIndicator>Generating your workout...</LoadingIndicator>
                  ) : (
                    "Generate Workout"
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              {workoutData && (
                <div className="space-y-6">
                  <WorkoutDisplay workout={workoutData} />
                  <Button onClick={handleSaveWorkout} className="w-full">
                    Save Workout
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
