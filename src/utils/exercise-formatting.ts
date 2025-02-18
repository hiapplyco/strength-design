
export function extractExerciseNames(text: string): string[] {
  if (!text) return [];
  
  // Common exercise patterns
  const patterns = [
    /\b(?:perform|do|complete)?\s*\d*\s*(?:sets?|reps?)\s*of\s*([A-Z][a-zA-Z\s-]+)(?=\s|$|\.|\,)/g,
    /\b([A-Z][a-zA-Z\s-]+)(?:\s*(?:for|x)\s*\d+\s*(?:sets?|reps?))/g,
    /\b([A-Z][a-zA-Z\s-]+)(?=\s*-\s*\d+\s*(?:sets?|reps?))/g,
  ];

  const exercises = new Set<string>();
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        exercises.add(match[1].trim());
      }
    }
  });

  return Array.from(exercises);
}
