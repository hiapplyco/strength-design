
import { WeeklyWorkouts, WorkoutDay, isWorkoutDay } from "@/types/fitness";

export const formatWorkoutToMarkdown = (workoutText: string): string => {
  // First, let's properly format the day headers
  const formattedText = workoutText.replace(/Day: day(\d+)/g, 'Day $1');
  
  // Convert the text to markdown
  return `# Weekly Workout Plan\n\n${formattedText}`;
};

export const formatAllWorkouts = (allWorkouts?: WeeklyWorkouts) => {
  if (!allWorkouts) return '';
  
  return Object.entries(allWorkouts)
    .filter(([day, workout]) => day !== '_meta' && isWorkoutDay(workout)) // Skip _meta and ensure it's a WorkoutDay
    .map(([day, workout]) => {
      // Cast to WorkoutDay since we've filtered with isWorkoutDay
      const workoutDay = workout as WorkoutDay;
      
      // Format the day number properly (e.g., "day1" to "Day 1")
      const formattedDay = day.replace(/day(\d+)/, 'Day $1');
      
      const sections = [
        `${formattedDay}`,
        workoutDay.strength && `Strength:\n${workoutDay.strength}`,
        workoutDay.warmup && `Warmup:\n${workoutDay.warmup}`,
        workoutDay.workout && `Workout:\n${workoutDay.workout}`,
        workoutDay.notes && `Notes:\n${workoutDay.notes}`
      ].filter(Boolean);
      
      return sections.join('\n\n');
    })
    .join('\n\n---\n\n');
};
