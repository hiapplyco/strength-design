
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { WorkoutDay, WorkoutData } from "@/types/fitness";
import { Database } from "@/integrations/supabase/types";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

const GeneratedWorkouts = () => {
  const [workouts, setWorkouts] = useState<GeneratedWorkout[]>([]);
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
          title: "Error",
          description: "Failed to load workouts. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [toast]);

  const handleWorkoutClick = (workout: GeneratedWorkout) => {
    // Safely cast the workout_data to WorkoutData type
    const workoutData = workout.workout_data as unknown as WorkoutData;
    let content = '';

    if (workout.title) {
      content += `# ${workout.title}\n\n`;
    }

    if (workout.summary) {
      content += `## Summary\n${workout.summary}\n\n`;
    }

    if (workoutData) {
      Object.entries(workoutData).forEach(([day, dayWorkout]) => {
        content += `## ${day}\n\n`;
        
        if (dayWorkout.description) {
          content += `### Description\n${dayWorkout.description}\n\n`;
        }
        
        if (dayWorkout.warmup) {
          content += `### Warmup\n${dayWorkout.warmup}\n\n`;
        }
        
        if (dayWorkout.strength) {
          content += `### Strength\n${dayWorkout.strength}\n\n`;
        }
        
        if (dayWorkout.workout) {
          content += `### Workout\n${dayWorkout.workout}\n\n`;
        }
        
        if (dayWorkout.notes) {
          content += `### Notes\n${dayWorkout.notes}\n\n`;
        }
      });
    }

    navigate('/document-editor', {
      state: {
        content: content.trim()
      }
    });
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/47062b35-74bb-47f1-aaa1-a642db4673ce.png")',
      }}
    >
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
              previous.programs
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Access and review your previously generated workout programs. Track your progress and adapt your training based on historical data.
            </p>
          </div>

          {isLoading ? (
            <p className="text-white text-center">Loading your workouts...</p>
          ) : (
            <div className="grid gap-4">
              {workouts.map((workout) => (
                <Card 
                  key={workout.id} 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-2 border-primary/20"
                  onClick={() => handleWorkoutClick(workout)}
                >
                  <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-white">
                      {workout.title || "Generated Workout"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <ScrollArea className="h-[100px] w-full rounded-md border border-white/20 p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-white/80 whitespace-pre-line">
                          {workout.summary || "A custom workout program"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {workout.generated_at ? 
                            formatDistanceToNow(new Date(workout.generated_at), { addSuffix: true }) :
                            "Recently generated"
                          }
                        </p>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;
