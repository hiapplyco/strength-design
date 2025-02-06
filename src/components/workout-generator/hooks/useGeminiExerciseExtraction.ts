import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Exercise } from "@/components/exercise-search/types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function useGeminiExerciseExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractExercises = async (workoutText: string): Promise<Exercise[]> => {
    setIsExtracting(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        Analyze this workout text and extract all exercises mentioned:
        ${workoutText}
        
        Return ONLY a JSON array of exercise objects with this format:
        {
          "name": "exercise name",
          "instructions": ["step 1", "step 2"],
          "type": "strength" or "cardio"
        }
        
        Include ONLY exercises that are explicitly mentioned in the text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      try {
        const exercises = JSON.parse(response);
        return exercises;
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        return [];
      }
    } catch (error) {
      console.error('Error extracting exercises:', error);
      return [];
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractExercises,
    isExtracting
  };
}