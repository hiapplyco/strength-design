import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Workout {
  id: string;
  title?: string;
  summary?: string;
  generated_at: string;
  workout_data: any;
}

export default function GeneratedWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchWorkouts = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your workouts.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('generated_workouts')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched workouts:', data);
      setWorkouts(data || []);
    } catch (error: any) {
      console.error('Error fetching workouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workouts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, navigate]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleViewWorkout = (workout: Workout) => {
    console.log('Viewing workout:', workout);
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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/47062b35-74bb-47f1-aaa1-a642db4673ce.png")',
      }}
    >
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-white">My Generated Workouts</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workouts.length > 0 ? (
              workouts.map((workout) => (
                <Card key={workout.id} className="hover:shadow-lg transition-shadow bg-black/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">{workout.title || 'Workout Plan'}</CardTitle>
                    <p className="text-sm text-gray-400">
                      Generated {formatDistanceToNow(new Date(workout.generated_at), { addSuffix: true })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      {workout.summary || 'Custom workout plan'}
                    </p>
                    <Button 
                      onClick={() => handleViewWorkout(workout)}
                      className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
                    >
                      View Workout
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-400">No workouts generated yet.</p>
                <Button 
                  className="mt-4 bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
                  onClick={() => navigate('/workout-generator')}
                >
                  Generate Your First Workout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}