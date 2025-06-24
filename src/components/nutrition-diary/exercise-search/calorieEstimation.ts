
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
    'burpee': 12,
    'squat': 8,
    'pushup': 7,
    'plank': 5,
    'jump': 10,
    'lunge': 7,
    'press': 6,
    'pull': 6,
    'row': 7,
    'default': 5
  };

  const exerciseType = Object.keys(caloriesPerMinute).find(type => 
    exerciseName.toLowerCase().includes(type)
  ) || 'default';

  return caloriesPerMinute[exerciseType] * minutes;
};

export const extractExercisesFromWorkout = (workout: any) => {
  const exercises: any[] = [];
  
  console.log('Extracting exercises from workout:', workout);
  
  if (!workout) return exercises;

  // Handle the new workout structure with cycles
  if (workout.cycle1 && workout.cycle1.day1) {
    const day = workout.cycle1.day1;
    
    // Extract from warmup
    if (day.warmup) {
      const warmupText = day.warmup;
      // Look for numbered lists or bullet points
      const warmupExercises = warmupText.match(/(\d+\.\s*|[-•]\s*)([^:\n\r]+)/g) || [];
      warmupExercises.forEach((exercise: string, index: number) => {
        const name = exercise.replace(/(\d+\.\s*|[-•]\s*)/, '').trim();
        if (name && name.length > 3) {
          exercises.push({ 
            name, 
            type: 'warmup', 
            description: `Warmup exercise: ${name}`,
            id: `warmup-${index}`
          });
        }
      });
    }

    // Extract from main workout
    if (day.workout) {
      const workoutText = day.workout;
      // Look for numbered lists, bullet points, or exercise names
      const workoutExercises = workoutText.match(/(\d+\.\s*|[-•]\s*)([^:\n\r]+)/g) || [];
      workoutExercises.forEach((exercise: string, index: number) => {
        const name = exercise.replace(/(\d+\.\s*|[-•]\s*)/, '').trim();
        if (name && name.length > 3) {
          exercises.push({ 
            name, 
            type: 'main', 
            description: `Main exercise: ${name}`,
            id: `main-${index}`
          });
        }
      });
    }

    // Extract from strength section
    if (day.strength) {
      const strengthText = day.strength;
      const strengthExercises = strengthText.match(/(\d+\.\s*|[-•]\s*)([^:\n\r]+)/g) || [];
      strengthExercises.forEach((exercise: string, index: number) => {
        const name = exercise.replace(/(\d+\.\s*|[-•]\s*)/, '').trim();
        if (name && name.length > 3) {
          exercises.push({ 
            name, 
            type: 'strength', 
            description: `Strength exercise: ${name}`,
            id: `strength-${index}`
          });
        }
      });
    }
  }

  // Handle older workout structure (days directly)
  if (workout.days && workout.days.length > 0) {
    const day = workout.days[0];
    
    if (day.warmup) {
      const warmupExercises = day.warmup.match(/\d+\.\s*([^:\n]+)/g) || [];
      warmupExercises.forEach((exercise: string, index: number) => {
        const name = exercise.replace(/\d+\.\s*/, '').trim();
        exercises.push({ 
          name, 
          type: 'warmup', 
          description: name,
          id: `warmup-old-${index}`
        });
      });
    }

    if (day.workout) {
      const workoutExercises = day.workout.match(/\d+\.\s*([^:\n]+)/g) || [];
      workoutExercises.forEach((exercise: string, index: number) => {
        const name = exercise.replace(/\d+\.\s*/, '').trim();
        exercises.push({ 
          name, 
          type: 'main', 
          description: name,
          id: `main-old-${index}`
        });
      });
    }
  }

  console.log('Extracted exercises:', exercises);
  return exercises;
};
