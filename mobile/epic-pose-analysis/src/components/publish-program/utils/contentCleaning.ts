
// Function to clean HTML content for teleprompter display
export const cleanContentForTeleprompter = (content: string): string => {
  if (!content) return '';
  
  try {
    // First try to parse as JSON in case it's a structured response
    const parsed = JSON.parse(content);
    if (parsed.content) {
      content = parsed.content;
    }
  } catch {
    // If not JSON, proceed with the original content
  }
  
  // Create a temporary div to strip HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Get plain text content
  let cleanText = tempDiv.textContent || tempDiv.innerText || content;
  
  // Remove CSS styles completely
  cleanText = cleanText.replace(/<style[\s\S]*?<\/style>/gi, '');
  cleanText = cleanText.replace(/body\s*\{[^}]*\}/gi, '');
  cleanText = cleanText.replace(/ul\s*\{[^}]*\}/gi, '');
  cleanText = cleanText.replace(/[a-zA-Z-]+\s*:\s*[^;]+;/g, '');
  
  // Remove common markdown and HTML patterns
  cleanText = cleanText
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/<!DOCTYPE.*?>/gi, '') // Remove DOCTYPE
    .replace(/<html.*?>|<\/html>/gi, '') // Remove html tags
    .replace(/<head.*?>[\s\S]*?<\/head>/gi, '') // Remove head section
    .replace(/<body.*?>|<\/body>/gi, '') // Remove body tags
    .replace(/<script.*?>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style.*?>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/font-family:\s*[^;]+;?/gi, '') // Remove font-family declarations
    .replace(/list-style-type:\s*[^;]+;?/gi, '') // Remove list-style declarations
    .replace(/margin-left:\s*[^;]+;?/gi, '') // Remove margin declarations
    
  // Clean up day sections and add proper formatting
  cleanText = cleanText
    .replace(/Day\s+(\d+)/gi, '\n\nDay $1\n') // Add line breaks around days
    .replace(/🎯\s*Focus/gi, '\n\nFocus:') // Format focus sections
    .replace(/🏃‍♂️\s*Warmup/gi, '\n\nWarmup:') // Format warmup sections
    .replace(/🏋️‍♂️\s*Workout/gi, '\n\nWorkout:') // Format workout sections
    .replace(/💪\s*Strength/gi, '\n\nStrength Focus:') // Format strength sections
    .replace(/📝\s*Notes/gi, '\n\nNotes:') // Format notes sections
    
  // Add line breaks for better readability
  cleanText = cleanText
    .replace(/(\d+)\s+minutes/g, '$1 minutes\n') // Break after time durations
    .replace(/(\d+)\s+sets/g, '\n$1 sets') // Break before sets
    .replace(/(\d+)\s+reps/g, '$1 reps\n') // Break after reps
    .replace(/Cool-down:/g, '\nCool-down:') // Break before cool-down
    .replace(/Adjust/g, '\nAdjust') // Break before adjustment notes
    .replace(/Focus\s+on/g, '\nFocus on') // Break before focus instructions
    
  // Clean up excessive whitespace but preserve intentional breaks
  cleanText = cleanText
    .replace(/\n{4,}/g, '\n\n\n') // Limit to max 3 consecutive newlines
    .replace(/\s{3,}/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
    .trim();
  
  // Split into paragraphs and ensure proper spacing
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return paragraphs.map(paragraph => {
    // Clean up each paragraph
    return paragraph
      .replace(/\s+/g, ' ')
      .trim();
  }).join('\n\n');
};
