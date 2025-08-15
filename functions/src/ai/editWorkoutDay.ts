import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const editWorkoutDay = onRequest({
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
        console.log('Starting workout day edit...');
        const params = req.body.data || req.body;
        
        // Extract parameters
        const {
          currentDay,
          userRequest,
          dayNumber,
          cycleNumber,
          fitnessLevel = 'beginner'
        } = params;

        if (!currentDay || !userRequest) {
          res.status(400).json({ error: "currentDay and userRequest are required" });
          return;
        }

        // Initialize Gemini API with secret
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
          console.error("GEMINI_API_KEY not configured");
          res.status(500).json({ error: "Service configuration error" });
          return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a fitness coach helping to modify a workout day based on user feedback.

Current workout day (Day ${dayNumber} of Cycle ${cycleNumber}):
${JSON.stringify(currentDay, null, 2)}

User's modification request: "${userRequest}"
User's fitness level: ${fitnessLevel}

Please modify ONLY the requested aspects of this workout day while maintaining:
1. The overall structure (warmup, workout, strength sections)
2. Appropriate difficulty for the fitness level
3. Safety and proper progression
4. The same JSON format

Return ONLY the modified workout day in valid JSON format, nothing else. The structure should match the input exactly but with the requested modifications applied.`;

        console.log('Sending edit request to Gemini...');

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.7
          }
        });

        const response = result.response;
        const responseText = response.text().trim();
        
        console.log('Received edited workout day');

        // Try to parse the JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const editedDay = JSON.parse(jsonMatch[0]);
        
        // Validate the structure matches expected format
        const requiredFields = ['description', 'warmup', 'workout', 'strength'];
        const missingFields = requiredFields.filter(field => !editedDay[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Modified day is missing required fields: ${missingFields.join(', ')}`);
        }

        // Return response wrapped in data field for httpsCallable compatibility
        res.status(200).json({ data: { editedDay } });

      } catch (error: any) {
        console.error('Error editing workout day:', error);
        res.status(500).json({
          error: 'Failed to edit workout day',
          message: error.message
        });
      }
    });
  });