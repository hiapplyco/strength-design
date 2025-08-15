import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const generateWorkoutTitle = onRequest({
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [geminiApiKey]
  }, async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        console.log('Starting title generation...');
        const params = req.body.data || req.body;
        
        // Extract relevant parameters for title generation
        const {
          prompt = '',
          fitnessLevel = 'beginner',
          prescribedExercises = '',
          numberOfDays = 7,
          numberOfCycles = 1,
          weatherPrompt = '',
          injuries = ''
        } = params;

        // Initialize Gemini API with secret
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
          console.error("GEMINI_API_KEY not configured");
          res.status(500).json({ error: "Service configuration error" });
          return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Create a context summary from parameters
        const contextSummary = `
Fitness Level: ${fitnessLevel}
Duration: ${numberOfCycles} cycle(s), ${numberOfDays} days each
${prompt ? `Focus: ${prompt}` : ''}
${prescribedExercises ? `Specific exercises: ${prescribedExercises}` : ''}
${weatherPrompt ? `Environment: ${weatherPrompt}` : ''}
${injuries ? `Considerations: ${injuries}` : ''}
        `.trim();
        
        const titlePrompt = `Generate a creative, motivating workout title based on this workout plan context. 
The title should be:
- Short (3-5 words max)
- Catchy and memorable
- Reflective of the workout's focus and fitness level
- Motivating and energetic

Context:
${contextSummary}

Return ONLY the title, nothing else.`;

        console.log('Sending prompt to Gemini...');

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: titlePrompt }] }],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.9
          }
        });

        const response = result.response;
        const title = response.text().trim();
        
        console.log('Generated title:', title);

        // Return response wrapped in data field for httpsCallable compatibility
        res.status(200).json({ data: { title } });

      } catch (error: any) {
        console.error('Error generating title:', error);
        res.status(500).json({
          error: 'Failed to generate title',
          message: error.message
        });
      }
    });
  });