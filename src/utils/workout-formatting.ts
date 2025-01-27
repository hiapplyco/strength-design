export const formatWorkoutToMarkdown = (content: string) => {
  const lines = content.split('\n');
  let markdown = '';
  let currentSection = '';

  lines.forEach(line => {
    if (line.includes('Day:')) {
      markdown += `<h2 class="text-2xl font-bold mb-4">${line.trim()}</h2>\n\n`;
    } else if (line.includes('Strength:')) {
      currentSection = 'strength';
      markdown += `<div class="mb-4">
        <h3 class="text-xl font-semibold mb-2">Strength</h3>
        <p>${line.replace('Strength:', '').trim()}</p>
      </div>\n\n`;
    } else if (line.includes('Warmup:')) {
      currentSection = 'warmup';
      markdown += `<div class="mb-4">
        <h3 class="text-xl font-semibold mb-2">Warm-up</h3>
        <p>${line.replace('Warmup:', '').trim()}</p>
      </div>\n\n`;
    } else if (line.includes('Workout:')) {
      currentSection = 'workout';
      markdown += `<div class="mb-4">
        <h3 class="text-xl font-semibold mb-2">Workout</h3>
        <p>${line.replace('Workout:', '').trim()}</p>
      </div>\n\n`;
    } else if (line.includes('Notes:')) {
      currentSection = 'notes';
      markdown += `<div class="mb-4">
        <h3 class="text-xl font-semibold mb-2">Notes</h3>
        <p>${line.replace('Notes:', '').trim()}</p>
      </div>\n\n`;
    } else if (line.trim() === '---') {
      markdown += `<hr class="my-8" />\n\n`;
    } else if (line.trim()) {
      if (currentSection === 'workout') {
        const items = line.split(',').map(item => item.trim());
        markdown += '<ul class="list-disc pl-4 mb-4">\n';
        items.forEach(item => {
          if (item) markdown += `  <li>${item}</li>\n`;
        });
        markdown += '</ul>\n';
      } else {
        markdown += `<p class="mb-4">${line.trim()}</p>\n`;
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