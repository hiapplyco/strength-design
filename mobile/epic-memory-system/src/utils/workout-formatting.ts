
import { WeeklyWorkouts, WorkoutDay, WorkoutCycle, isWorkoutDay, isWorkoutCycle } from "@/types/fitness";

export const formatWorkoutToMarkdown = (workoutText: string): string => {
  // First, let's properly format the day headers
  const formattedText = workoutText.replace(/Day: day(\d+)/g, 'Day $1');
  
  // Convert the text to markdown
  return `# Weekly Workout Plan\n\n${formattedText}`;
};

export const formatAllWorkouts = (allWorkouts?: WeeklyWorkouts) => {
  if (!allWorkouts) return '';
  
  const cycles: string[] = [];
  
  // Process all cycles first
  Object.entries(allWorkouts)
    .filter(([key]) => key !== '_meta')
    .forEach(([key, value]) => {
      if (isWorkoutCycle(value)) {
        // Handle cycle structure
        const cycleTitle = key.charAt(0).toUpperCase() + key.slice(1);
        cycles.push(`## ${cycleTitle}\n`);
        
        // Process all days within this cycle
        Object.entries(value as WorkoutCycle)
          .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
          .forEach(([dayKey, dayValue]) => {
            const workoutDay = dayValue as WorkoutDay;
            const formattedDay = dayKey.replace(/day(\d+)/, 'Day $1');
            
            const sections = [
              `### ${formattedDay}`,
              workoutDay.description && `**Focus:** ${workoutDay.description}`,
              workoutDay.strength && `**Strength:**\n${workoutDay.strength}`,
              workoutDay.warmup && `**Warmup:**\n${workoutDay.warmup}`,
              workoutDay.workout && `**Workout:**\n${workoutDay.workout}`,
              workoutDay.notes && `**Notes:**\n${workoutDay.notes}`
            ].filter(Boolean);
            
            cycles.push(sections.join('\n\n'));
          });
        
        cycles.push('\n---\n');
      } else if (isWorkoutDay(value)) {
        // Handle legacy single days (no cycle structure)
        const workoutDay = value as WorkoutDay;
        const formattedDay = key.replace(/day(\d+)/, 'Day $1');
        
        const sections = [
          `### ${formattedDay}`,
          workoutDay.description && `**Focus:** ${workoutDay.description}`,
          workoutDay.strength && `**Strength:**\n${workoutDay.strength}`,
          workoutDay.warmup && `**Warmup:**\n${workoutDay.warmup}`,
          workoutDay.workout && `**Workout:**\n${workoutDay.workout}`,
          workoutDay.notes && `**Notes:**\n${workoutDay.notes}`
        ].filter(Boolean);
        
        cycles.push(sections.join('\n\n'));
      }
    });
  
  return cycles.join('\n\n');
};
