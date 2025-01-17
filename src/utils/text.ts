export const sanitizeText = (text: string): string => {
  // Remove special characters that might cause issues with TTS
  return text.replace(/[^\w\s.,!?-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};