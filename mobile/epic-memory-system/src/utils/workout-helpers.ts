
import { WorkoutDay, WorkoutMeta, isWorkoutDay as typeGuardIsWorkoutDay } from "@/types/fitness";

/**
 * Safely gets a workout property, ensuring that we only access it
 * if the object is a WorkoutDay
 */
export function safelyGetWorkoutProperty<K extends keyof WorkoutDay>(
  workout: WorkoutDay | WorkoutMeta, 
  property: K
): WorkoutDay[K] | undefined {
  if (typeGuardIsWorkoutDay(workout)) {
    return workout[property];
  }
  return undefined;
}

/**
 * Filter an object to only include workout day entries
 */
export function filterWorkoutDays(
  workouts: Record<string, WorkoutDay | WorkoutMeta>
): Record<string, WorkoutDay> {
  return Object.entries(workouts)
    .filter(([key, value]) => key !== '_meta' && typeGuardIsWorkoutDay(value))
    .reduce((acc, [key, value]) => {
      acc[key] = value as WorkoutDay;
      return acc;
    }, {} as Record<string, WorkoutDay>);
}

/**
 * Re-export the type guard for convenience
 */
export const isWorkoutDay = typeGuardIsWorkoutDay;
