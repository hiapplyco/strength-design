
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkoutCard } from "./WorkoutCard";
import { Database } from "@/integrations/supabase/types";
import { WorkoutData, WorkoutDay, isWorkoutDay } from "@/types/fitness";
import { safelyGetWorkoutProperty } from "@/utils/workout-helpers";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

export const WorkoutList = () => {
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
        if (!isWorkoutDay(dayWorkout)) return; // Skip if not a workout day (like _meta)
        
        content += `## ${day}\n\n`;
        
        const description = safelyGetWorkoutProperty(dayWorkout, 'description');
        if (description) {
          content += `### Description\n${description}\n\n`;
        }
        
        const warmup = safelyGetWorkoutProperty(dayWorkout, 'warmup');
        if (warmup) {
          content += `### Warmup\n${warmup}\n\n`;
        }
        
        const strength = safelyGetWorkoutProperty(dayWorkout, 'strength');
        if (strength) {
          content += `### Strength\n${strength}\n\n`;
        }
        
        const workoutContent = safelyGetWorkoutProperty(dayWorkout, 'workout');
        if (workoutContent) {
          content += `### Workout\n${workoutContent}\n\n`;
        }
        
        const notes = safelyGetWorkoutProperty(dayWorkout, 'notes');
        if (notes) {
          content += `### Notes\n${notes}\n\n`;
        }
      });
    }
    
    navigate('/document-editor', {
      state: {
        content: content.trim()
      }
    });
  };

  if (isLoading) {
    return <p className="text-white text-center">Loading your workouts...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {workouts.map(workout => (
        <WorkoutCard 
          key={workout.id} 
          workout={workout} 
          onClick={handleWorkoutClick} 
        />
      ))}
    </div>
  );
};
