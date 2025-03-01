
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { WorkoutDay, WorkoutData } from "@/types/fitness";
import { Database } from "@/integrations/supabase/types";
import { Dumbbell, Calendar, Tag, ClipboardList } from "lucide-react";

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
          variant: "destructive"
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

  // Helper function to get first day workout preview
  const getFirstDayPreview = (workoutData: WorkoutData): { day: string, workout: WorkoutDay } | null => {
    if (!workoutData) return null;
    const entries = Object.entries(workoutData);
    if (entries.length === 0) return null;
    return { day: entries[0][0], workout: entries[0][1] };
  };

  // Helper function to count total exercises
  const countExercises = (workoutData: WorkoutData): number => {
    if (!workoutData) return 0;
    
    let count = 0;
    Object.values(workoutData).forEach(day => {
      // Count exercises from the workout text using a simple heuristic
      const workoutText = [day.warmup, day.workout, day.strength].join(' ');
      // Count exercise occurrences by looking for patterns like "3x10" or exercises followed by sets
      const exerciseMatches = workoutText.match(/\b\d+\s*[xX]\s*\d+\b/g);
      count += exerciseMatches ? exerciseMatches.length : 0;
    });
    
    return count;
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
         style={{ backgroundImage: 'url("/lovable-uploads/47062b35-74bb-47f1-aaa1-a642db4673ce.png")' }}>
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(0,112,243,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
              previous.programs
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Access and review your previously generated workout programs. Track your progress and adapt your training based on historical data.
            </p>
          </div>

          {isLoading ? (
            <p className="text-white text-center">Loading your workouts...</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workouts.map(workout => {
                // Cast workout data for preview
                const workoutData = workout.workout_data as unknown as WorkoutData;
                const firstDay = getFirstDayPreview(workoutData);
                const totalExercises = countExercises(workoutData);
                const totalDays = workoutData ? Object.keys(workoutData).length : 0;
                
                return (
                  <Card 
                    key={workout.id} 
                    className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-2 border-primary/20 overflow-hidden"
                    onClick={() => handleWorkoutClick(workout)}
                  >
                    <CardHeader className="px-6 pt-6 pb-2">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        {workout.title || "Generated Workout"}
                      </CardTitle>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {workout.tags && workout.tags.length > 0 && workout.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-black/50 text-xs">
                            {tag}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="bg-black/50 text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {totalDays} day{totalDays !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline" className="bg-black/50 text-xs flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          ~{totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="px-6 pb-4">
                      <ScrollArea className="h-[180px] w-full border border-white/20 p-4 px-[13px] py-[12px] rounded-lg">
                        <div className="space-y-3">
                          {workout.summary && (
                            <div>
                              <h3 className="text-sm font-semibold text-primary mb-1">Program Summary</h3>
                              <p className="text-white/80 whitespace-pre-line text-sm pb-2 font-light leading-relaxed">
                                {workout.summary}
                              </p>
                            </div>
                          )}
                          
                          {firstDay && (
                            <div>
                              <h3 className="text-sm font-semibold text-primary mb-1">
                                {firstDay.day} Preview
                              </h3>
                              {firstDay.workout.description && (
                                <p className="text-white/80 text-xs italic mb-1">
                                  {firstDay.workout.description.substring(0, 120)}
                                  {firstDay.workout.description.length > 120 ? '...' : ''}
                                </p>
                              )}
                              {firstDay.workout.strength && (
                                <div className="mt-1">
                                  <span className="text-white/90 text-xs font-semibold">Strength:</span>
                                  <p className="text-white/70 text-xs pl-2">
                                    {firstDay.workout.strength.substring(0, 100)}
                                    {firstDay.workout.strength.length > 100 ? '...' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    
                    <CardFooter className="px-6 py-3 border-t border-white/10 bg-black/40 flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        {workout.generated_at 
                          ? formatDistanceToNow(new Date(workout.generated_at), { addSuffix: true }) 
                          : "Recently generated"}
                      </p>
                      <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-black/30">
                        View Program
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;
