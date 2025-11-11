import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { createWorkoutGenerationPrompt } from "../shared/prompts";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const generateWorkout = onRequest({
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [geminiApiKey]
  }, async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        console.log('Starting workout generation...');
        const params = req.body;
        console.log('Received params:', JSON.stringify(params, null, 2));

        // Initialize Gemini API with secret
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
          console.error("GEMINI_API_KEY not configured");
          res.status(500).json({ error: "Service configuration error" });
          return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Validate and process all input parameters
        const processedParams = {
          numberOfDays: Number(params.numberOfDays) || 7,
          numberOfCycles: Number(params.numberOfCycles) || 1,
          fitnessLevel: String(params.fitnessLevel || 'beginner'),
          weatherPrompt: String(params.weatherPrompt || ''),
          prescribedExercises: String(params.prescribedExercises || ''),
          injuries: String(params.injuries || ''),
          prompt: String(params.prompt || ''),
          chatHistory: params.chatHistory || []
        };

        // Create the workout generation prompt using all parameters including chat history
        const fullPrompt = createWorkoutGenerationPrompt({
          numberOfDays: processedParams.numberOfDays,
          numberOfCycles: processedParams.numberOfCycles,
          fitnessLevel: processedParams.fitnessLevel,
          weatherPrompt: processedParams.weatherPrompt,
          prescribedExercises: processedParams.prescribedExercises,
          injuries: processedParams.injuries,
          chatHistory: processedParams.chatHistory
        });
        
        console.log('Sending prompt to Gemini...');

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: {
            maxOutputTokens: 8000,
            temperature: 0.7
          }
        });

        console.log('Received response from Gemini');
        const response = result.response;
        const responseText = response.text();
        console.log('Raw response preview:', responseText.substring(0, 200) + '...');

        // Try to find and parse JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const workoutData = JSON.parse(jsonMatch[0]);
        
        // Validate the structure - now checking for cycles
        const expectedCycles = Array.from({ length: processedParams.numberOfCycles }, (_, i) => `cycle${i + 1}`);
        const missingCycles = expectedCycles.filter(cycle => !workoutData[cycle]);
        
        if (missingCycles.length > 0) {
          throw new Error(`Missing cycles: ${missingCycles.join(', ')}`);
        }

        // Validate each day in each cycle
        for (const cycle of expectedCycles) {
          const cycleData = workoutData[cycle];
          const expectedDays = Array.from({ length: processedParams.numberOfDays }, (_, i) => `day${i + 1}`);
          const missingDays = expectedDays.filter(day => !cycleData[day]);
          
          if (missingDays.length > 0) {
            throw new Error(`Missing workouts for ${cycle}: days ${missingDays.join(', ')}`);
          }

          // Validate each day has required fields
          Object.entries(cycleData).forEach(([day, workout]: [string, any]) => {
            const requiredFields = ['description', 'warmup', 'workout', 'strength'];
            const missingFields = requiredFields.filter(field => !workout[field]);
            
            if (missingFields.length > 0) {
              throw new Error(`${cycle} - ${day} is missing required fields: ${missingFields.join(', ')}`);
            }
          });
        }

        console.log('Successfully validated workout data');
        
        // Add debug information to the response for transparency
        const responseData = {
          ...workoutData,
          _meta: {
            inputsUsed: {
              numberOfDays: processedParams.numberOfDays,
              numberOfCycles: processedParams.numberOfCycles,
              fitnessLevel: processedParams.fitnessLevel,
              weatherPrompt: processedParams.weatherPrompt ? 'provided' : 'none',
              prescribedExercises: processedParams.prescribedExercises ? 'provided' : 'none',
              injuries: processedParams.injuries ? 'provided' : 'none',
              additionalPrompt: processedParams.prompt ? 'provided' : 'none',
              chatHistoryLength: processedParams.chatHistory.length
            },
            promptLength: fullPrompt.length,
            responseLength: responseText.length
          }
        };

        // Return response wrapped in data field for httpsCallable compatibility
        res.status(200).json({ data: responseData });

      } catch (error: any) {
        console.error('Error generating workout:', error);
        console.error('Error details:', error.stack);

        res.status(500).json({
          error: 'Failed to generate workout',
          message: error.message,
          details: error.stack
        });
      }
    });
  });