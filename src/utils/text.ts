export const sanitizeText = (text: string): string => {
  // Remove special characters that might cause issues with TTS
  // but keep basic punctuation and formatting
  return text
    .replace(/[^\w\s.,!?;:()\-–—]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ')                  // Replace multiple spaces with single space
    .replace(/(\d+)x/g, '$1 times')        // Replace "5x" with "5 times"
    .replace(/(\d+)m/g, '$1 meters')       // Replace "100m" with "100 meters"
    .replace(/(\d+)s/g, '$1 seconds')      // Replace "30s" with "30 seconds"
    .replace(/(\d+)min/g, '$1 minutes')    // Replace "2min" with "2 minutes"
    .replace(/@/g, 'at')                   // Replace "@" with "at"
    .replace(/%/g, 'percent')              // Replace "%" with "percent"
    .replace(/&/g, 'and')                  // Replace "&" with "and"
    .replace(/\+/g, 'plus')                // Replace "+" with "plus"
    .replace(/=/g, 'equals')               // Replace "=" with "equals"
    .trim();                               // Remove leading/trailing whitespace
};

// Clean JSON text by removing markdown and invalid syntax
export const cleanJsonText = (text: string): string => {
  return text
    .replace(/```json\s*|\s*```/g, '')           // Remove markdown code blocks
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')     // Remove comments
    .replace(/,(\s*[}\]])/g, '$1')               // Remove trailing commas
    .replace(/\s+/g, ' ')                        // Normalize whitespace
    .replace(/\\n/g, ' ')                        // Replace escaped newlines
    .replace(/\n/g, ' ')                         // Remove actual newlines
    .trim();                                     // Remove leading/trailing whitespace
};
