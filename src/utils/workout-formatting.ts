export const formatWorkoutToMarkdown = (workoutText: string): string => {
  // First, let's properly format the day headers
  const formattedText = workoutText
    .replace(/Day: day(\d+)/g, '## Day $1')
    .replace(/Strength:/g, '### Strength:')
    .replace(/Warmup:/g, '### Warmup:')
    .replace(/Workout:/g, '### Workout:')
    .replace(/Notes:/g, '### Notes:');
  
  // Convert the text to markdown
  return `# Weekly Workout Plan\n\n${formattedText}`;
};

export const formatAllWorkouts = (allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>) => {
  if (!allWorkouts) return '';
  
  return Object.entries(allWorkouts)
    .map(([day, workout]) => {
      // Format the day number properly (e.g., "day1" to "Day 1")
      const formattedDay = day.replace(/day(\d+)/, '## Day $1');
      
      const sections = [
        `${formattedDay}`,
        workout.strength && `### Strength\n${workout.strength}`,
        workout.warmup && `### Warmup\n${workout.warmup}`,
        workout.workout && `### Workout\n${workout.workout}`,
        workout.notes && `### Notes\n${workout.notes}`
      ].filter(Boolean);
      
      return sections.join('\n\n');
    })
    .join('\n\n---\n\n');
};