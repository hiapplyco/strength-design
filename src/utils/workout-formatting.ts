export const formatWorkoutToMarkdown = (workoutText: string): string => {
  // First, let's properly format the day headers
  const formattedText = workoutText.replace(/Day: day(\d+)/g, 'Day $1');
  
  // Convert the text to markdown
  return `# Weekly Workout Plan\n\n${formattedText}`;
};