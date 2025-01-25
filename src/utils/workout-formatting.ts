export const formatWorkoutToMarkdown = (content: string) => {
  const lines = content.split('\n');
  let markdown = '';
  let currentSection = '';

  lines.forEach(line => {
    if (line.includes('Day:')) {
      markdown += `\n# ${line.trim()}\n\n`;
    } else if (line.includes('Strength:')) {
      currentSection = 'strength';
      markdown += `## 💪 Strength\n\n`;
    } else if (line.includes('Warmup:')) {
      currentSection = 'warmup';
      markdown += `## 🔥 Warm-up\n\n`;
    } else if (line.includes('Workout:')) {
      currentSection = 'workout';
      markdown += `## 🏋️‍♂️ Workout\n\n`;
    } else if (line.includes('Notes:')) {
      currentSection = 'notes';
      markdown += `## 📝 Notes\n\n`;
    } else if (line.trim() === '---') {
      markdown += `\n---\n\n`;
    } else if (line.trim()) {
      if (currentSection === 'workout') {
        const items = line.split(',').map(item => item.trim());
        items.forEach(item => {
          if (item) markdown += `- ${item}\n`;
        });
      } else {
        markdown += `${line.trim()}\n`;
      }
    }
  });

  return markdown;
};

export const formatAllWorkouts = (allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>) => {
  if (!allWorkouts) return '';
  return Object.entries(allWorkouts)
    .map(([day, workout]) => {
      const sections = [
        `Day: ${day}`,
        workout.strength && `Strength:\n${workout.strength}`,
        workout.warmup && `Warmup:\n${workout.warmup}`,
        workout.workout && `Workout:\n${workout.workout}`,
        workout.notes && `Notes:\n${workout.notes}`
      ].filter(Boolean);
      return sections.join('\n\n');
    })
    .join('\n\n---\n\n');
};