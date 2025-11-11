
import { useNavigate } from "react-router-dom";
import { WorkoutCard } from "./WorkoutCard";
import { Workout } from "@/lib/firebase/types";
import { WorkoutData, isWorkoutDay } from "@/types/fitness";
import { safelyGetWorkoutProperty } from "@/utils/workout-helpers";
import { Info } from "lucide-react";

type GeneratedWorkout = Workout & { id: string };

interface WorkoutListProps {
  workouts: GeneratedWorkout[];
  selectedWorkouts: string[];
  onToggleSelection: (workoutId: string) => void;
  onToggleFavorite: (workoutId:string) => void;
  onDuplicate: (workoutId: string) => void;
}

export const WorkoutList = ({ workouts, selectedWorkouts, onToggleSelection, onToggleFavorite, onDuplicate }: WorkoutListProps) => {
  const navigate = useNavigate();

  const handleWorkoutClick = (workout: GeneratedWorkout) => {
    const workoutData = workout.workoutData as unknown as WorkoutData;
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

  if (workouts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-lg flex flex-col items-center justify-center animate-fade-in">
        <Info className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No Workouts Found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {workouts.map(workout => (
        <WorkoutCard 
          key={workout.id} 
          workout={workout} 
          onClick={handleWorkoutClick}
          isSelected={selectedWorkouts.includes(workout.id)}
          onToggleSelection={onToggleSelection}
          onToggleFavorite={onToggleFavorite}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
};
