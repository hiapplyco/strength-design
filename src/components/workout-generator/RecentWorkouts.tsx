
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WeeklyWorkouts } from "@/types/fitness";

interface RecentWorkoutsProps {
  recentWorkouts: Array<{id: string, name: string, date: string}>;
  onWorkoutSelect: (workout: WeeklyWorkouts) => void;
}

export function RecentWorkouts({ recentWorkouts, onWorkoutSelect }: RecentWorkoutsProps) {
  if (recentWorkouts.length === 0) return null;
  
  return (
    <div className="mb-8 bg-black/70 p-4 rounded-lg">
      <h3 className="text-white text-lg mb-2 font-semibold flex items-center">
        <Star size={16} className="mr-2 text-yellow-400" />
        Recent Workouts
      </h3>
      <div className="flex flex-wrap gap-2">
        {recentWorkouts.map(workout => (
          <Badge 
            key={workout.id} 
            variant="outline"
            className="cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => {
              try {
                const saved = localStorage.getItem(workout.id);
                if (saved) {
                  onWorkoutSelect(JSON.parse(saved));
                }
              } catch (e) {
                console.error("Failed to load saved workout", e);
              }
            }}
          >
            {workout.name} • {workout.date}
          </Badge>
        ))}
      </div>
    </div>
  );
}
