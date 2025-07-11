import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Calendar, ClipboardList, Dumbbell, Star, Share2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkoutData, WorkoutDay } from "@/types/fitness";
import { Database } from "@/integrations/supabase/types";
import { WorkoutPreview } from "./WorkoutPreview";
import { safelyGetWorkoutProperty, isWorkoutDay } from "@/utils/workout-helpers";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

interface WorkoutCardProps {
  workout: GeneratedWorkout;
  onClick: (workout: GeneratedWorkout) => void;
  isSelected: boolean;
  onToggleSelection: (workoutId: string) => void;
  onToggleFavorite: (workoutId: string) => void;
  onDuplicate: (workoutId: string) => void;
}

export const WorkoutCard = ({ workout, onClick, isSelected, onToggleSelection, onToggleFavorite, onDuplicate }: WorkoutCardProps) => {
  const { toast } = useToast();
  const workoutData = workout.workout_data as unknown as WorkoutData;
  const firstDay = getFirstDayPreview(workoutData);
  const totalExercises = countExercises(workoutData);
  const totalDays = workoutData ? Object.entries(workoutData).filter(([, value]) => isWorkoutDay(value)).length : 0;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(workout.id);
  };
  
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Share clicked",
      description: "This feature is not yet implemented.",
      duration: 3000,
    });
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(workout.id);
  };
  
  return (
    <Card 
      key={workout.id} 
      className={cn(
        "transition-all hover:shadow-lg hover:border-primary/40 cursor-pointer overflow-hidden group flex flex-col relative",
        isSelected && "ring-2 ring-primary border-primary/60"
      )}
      onClick={() => onClick(workout)}
    >
      {/* Top Row: Checkbox and Action Icons */}
      <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(workout.id)}
          className={cn(
            "h-5 w-5 rounded-sm transition-all",
            "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
            "data-[state=unchecked]:bg-background/80"
          )}
          aria-label={`Select workout ${workout.title}`}
        />
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-8 w-8 text-muted-foreground hover:bg-yellow-500/10",
            workout.is_favorite ? "text-yellow-400 hover:text-yellow-500" : "hover:text-yellow-500"
          )} 
          onClick={handleFavoriteClick}
        >
          <Star className={cn("h-4 w-4", workout.is_favorite && "fill-current")} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10" onClick={handleShareClick}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" onClick={handleDuplicateClick}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="px-6 pt-16 pb-4">
        <div className="space-y-4">
          <CardTitle className="text-white flex items-start gap-3 text-xl leading-relaxed">
            <Dumbbell className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <span className="flex-1 font-medium">{workout.title || "Generated Workout"}</span>
          </CardTitle>
          
          {workout.tags && workout.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {workout.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-4 flex-grow">
        <ScrollArea className="h-[180px] w-full border border-border p-4 rounded-lg bg-background/50">
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
        <div className="flex flex-wrap gap-2 mt-4">
           <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {totalDays} day{totalDays !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            ~{totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t border-border mt-auto bg-card-footer flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {workout.generated_at 
            ? formatDistanceToNow(new Date(workout.generated_at), { addSuffix: true }) 
            : "Recently generated"}
        </p>
        <Button variant="ghost" size="sm" className="text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
          View Program
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
