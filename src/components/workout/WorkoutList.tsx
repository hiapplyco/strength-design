import { WorkoutCard } from "@/components/WorkoutCard";

interface WorkoutListProps {
  workouts: Array<{
    title: string;
    description: string;
    duration: string;
  }>;
  workoutDetails: Record<string, any>;
  onWorkoutUpdate: (updates: any) => void;
}

export function WorkoutList({ workouts, workoutDetails, onWorkoutUpdate }: WorkoutListProps) {
  return (
    <div className="grid gap-8 md:gap-12 grid-cols-1">
      {workouts.map((workout) => (
        <WorkoutCard 
          key={workout.title} 
          {...workout} 
          allWorkouts={workoutDetails}
          onUpdate={(updates) => onWorkoutUpdate(updates)}
        />
      ))}
    </div>
  );
}