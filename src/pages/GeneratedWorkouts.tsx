import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function GeneratedWorkouts() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const { data, error } = await supabase
          .from('generated_workouts')
          .select('*')
          .order('generated_at', { ascending: false });

        if (error) throw error;
        setWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load workouts. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [toast]);

  const handleViewWorkout = (workout: any) => {
    navigate('/document-editor', {
      state: { content: JSON.stringify(workout.workout_data) }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Generated Workouts</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map((workout) => (
          <Card key={workout.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{workout.title || 'Workout Plan'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated {formatDistanceToNow(new Date(workout.generated_at), { addSuffix: true })}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {workout.summary || 'Custom workout plan'}
              </p>
              <Button onClick={() => handleViewWorkout(workout)}>
                View Workout
              </Button>
            </CardContent>
          </Card>
        ))}
        {workouts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground">No workouts generated yet.</p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/workout-generator')}
            >
              Generate Your First Workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}