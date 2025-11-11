
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
    // Use exec in a loop instead of matchAll for better compatibility
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        exercises.add(match[1].trim());
      }
    }
  });

  return Array.from(exercises);
}

export function extractImageUrlsFromMarkdown(markdown: string): string[] {
  const imageUrls: string[] = [];
  const regex = /!\[.*?\]\((.*?)\)/g;
  
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    if (match[1]) {
      imageUrls.push(match[1]);
    }
  }
  
  return imageUrls;
}
