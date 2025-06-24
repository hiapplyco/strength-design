
export const estimateCalories = (exerciseName: string, minutes: number): number => {
  // Simple calorie estimation based on exercise type
  const caloriesPerMinute: { [key: string]: number } = {
    'running': 10,
    'cycling': 8,
    'swimming': 9,
    'walking': 4,
    'yoga': 3,
    'weightlifting': 6,
    'cardio': 8,
    'strength': 6,
    'hiit': 12,
    'default': 5
  };

  const exerciseType = Object.keys(caloriesPerMinute).find(type => 
    exerciseName.toLowerCase().includes(type)
  ) || 'default';

  return caloriesPerMinute[exerciseType] * minutes;
};

export const extractExercisesFromWorkout = (workout: any) => {
  const exercises: any[] = [];
  
  if (workout.days && workout.days.length > 0) {
    const day = workout.days[0];
    
    // Extract from warmup
    if (day.warmup) {
      const warmupExercises = day.warmup.match(/\d+\.\s*([^:\n]+)/g) || [];
      warmupExercises.forEach((exercise: string) => {
        const name = exercise.replace(/\d+\.\s*/, '').trim();
        exercises.push({ name, type: 'warmup', description: name });
      });
    }

    // Extract from main workout
    if (day.workout) {
      const workoutExercises = day.workout.match(/\d+\.\s*([^:\n]+)/g) || [];
      workoutExercises.forEach((exercise: string) => {
        const name = exercise.replace(/\d+\.\s*/, '').trim();
        exercises.push({ name, type: 'main', description: name });
      });
    }
  }

  return exercises;
};
