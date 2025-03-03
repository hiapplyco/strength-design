
import { formatDistanceToNow } from "date-fns";
import { Calendar, ClipboardList, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkoutData, WorkoutDay } from "@/types/fitness";
import { Database } from "@/integrations/supabase/types";
import { WorkoutPreview } from "./WorkoutPreview";
import { safelyGetWorkoutProperty, isWorkoutDay } from "@/utils/workout-helpers";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

interface WorkoutCardProps {
  workout: GeneratedWorkout;
  onClick: (workout: GeneratedWorkout) => void;
}

export const WorkoutCard = ({ workout, onClick }: WorkoutCardProps) => {
  const workoutData = workout.workout_data as unknown as WorkoutData;
  const firstDay = getFirstDayPreview(workoutData);
  const totalExercises = countExercises(workoutData);
  const totalDays = workoutData ? Object.entries(workoutData).filter(([key, value]) => isWorkoutDay(value)).length : 0;
  
  return (
    <Card 
      key={workout.id} 
      className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-2 border-primary/20 overflow-hidden"
      onClick={() => onClick(workout)}
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
            
            {firstDay && <WorkoutPreview day={firstDay.day} workout={firstDay.workout} />}
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
};

// Helper function to get the first day of workout for preview
const getFirstDayPreview = (workoutData: WorkoutData): { day: string, workout: WorkoutDay } | null => {
  if (!workoutData) return null;
  const entries = Object.entries(workoutData).filter(([key, value]) => isWorkoutDay(value));
  if (entries.length === 0) return null;
  return { day: entries[0][0], workout: entries[0][1] as WorkoutDay };
};

// Helper function to count exercises in workout
const countExercises = (workoutData: WorkoutData): number => {
  if (!workoutData) return 0;
  
  let count = 0;
  Object.entries(workoutData).forEach(([_, day]) => {
    if (!isWorkoutDay(day)) return; // Skip if not a workout day
    
    const workoutText = [
      safelyGetWorkoutProperty(day, 'warmup') || '',
      safelyGetWorkoutProperty(day, 'workout') || '',
      safelyGetWorkoutProperty(day, 'strength') || ''
    ].join(' ');
    
    const exerciseMatches = workoutText.match(/\b\d+\s*[xX]\s*\d+\b/g);
    count += exerciseMatches ? exerciseMatches.length : 0;
  });
  
  return count;
};
