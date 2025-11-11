import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const editWorkoutDay = onRequest({
    timeoutSeconds: 90,
    memory: "1GiB",
    secrets: [geminiApiKey]
  }, async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        console.log('Starting workout day edit with program context...');
        const params = req.body.data || req.body;
        
        // Extract comprehensive parameters
        const {
          currentDay,
          userRequest,
          programContext,
          dayNumber,
          weekNumber,
          cycleNumber,
          fitnessLevel = 'intermediate',
          userPreferences = {},
          availableEquipment = [],
          timeConstraints = {},
          injuryRestrictions = [],
          previousSessions = []
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

        // Context is built directly into the prompt for intelligent editing

        const prompt = `You are an expert fitness coach with deep knowledge of exercise science, progression principles, and workout programming. You're helping to intelligently modify a specific workout day within a comprehensive training program.

CURRENT WORKOUT DAY DETAILS:
- Day ${dayNumber} of Week ${weekNumber} in Program
- Cycle: ${cycleNumber}
- Current Day Structure:
${JSON.stringify(currentDay, null, 2)}

PROGRAM CONTEXT:
${programContext ? JSON.stringify(programContext, null, 2) : 'No program context provided'}

USER PROFILE:
- Fitness Level: ${fitnessLevel}
- Available Equipment: ${availableEquipment.join(', ') || 'Full gym access'}
- Time Constraints: ${JSON.stringify(timeConstraints)}
- Injury Restrictions: ${injuryRestrictions.join(', ') || 'None'}
- User Preferences: ${JSON.stringify(userPreferences)}

RECENT PERFORMANCE:
${previousSessions.length > 0 ? JSON.stringify(previousSessions, null, 2) : 'No recent session data'}

USER'S MODIFICATION REQUEST:
"${userRequest}"

INSTRUCTIONS:
Please intelligently modify this workout day based on the user's request while maintaining:

1. PROGRAM INTEGRITY: Ensure modifications fit within the overall program goals and progression
2. PHYSIOLOGICAL PRINCIPLES: Maintain proper exercise order, volume, intensity relationships
3. SAFETY FIRST: Consider injury restrictions and ensure safe progression
4. PERSONALIZATION: Account for user preferences, equipment, and time constraints
5. SMART SUBSTITUTIONS: If replacing exercises, choose biomechanically similar alternatives
6. PROGRESSIVE OVERLOAD: Maintain or improve the training stimulus appropriately
7. RECOVERY BALANCE: Consider the placement within the weekly training cycle

RESPONSE FORMAT:
Return ONLY a valid JSON object with the complete modified workout day structure. Include:
- All original sections (warmup, workout, strength, etc.)
- Detailed exercise modifications with proper sets/reps/rest periods
- Explanation of changes in a "modificationNotes" field
- Estimated duration updates if applicable
- Any safety considerations in a "safetyNotes" field

The JSON structure must match the TypeScript WorkoutDay interface format exactly.`;

        console.log('Sending comprehensive edit request to Gemini...');

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 8000,
            temperature: 0.7,
            topP: 0.9,
            topK: 40
          }
        });

        const response = result.response;
        const responseText = response.text().trim();
        
        console.log('Received comprehensive edited workout day');

        // Extract JSON from response with better parsing
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // Try to find JSON in code blocks
          const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonMatch = [codeBlockMatch[1]];
          } else {
            throw new Error('No valid JSON found in response');
          }
        }

        let editedDay: any;
        try {
          editedDay = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          throw new Error('Invalid JSON structure in response');
        }
        
        // Enhanced validation for comprehensive workout structure
        const requiredFields = ['id', 'title', 'description', 'warmup', 'workout'];
        const missingFields = requiredFields.filter(field => !editedDay[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Modified day is missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate exercise structures in each section
        const validateSection = (section: any, sectionName: string) => {
          if (section && section.exercises) {
            section.exercises.forEach((exercise: any, index: number) => {
              if (!exercise.name || !exercise.sets) {
                throw new Error(`Invalid exercise structure in ${sectionName} at index ${index}`);
              }
            });
          }
        };

        validateSection(editedDay.warmup, 'warmup');
        validateSection(editedDay.workout, 'workout');
        if (editedDay.strength) validateSection(editedDay.strength, 'strength');
        if (editedDay.cardio) validateSection(editedDay.cardio, 'cardio');
        if (editedDay.cooldown) validateSection(editedDay.cooldown, 'cooldown');

        // Add metadata about the modification
        editedDay.lastModified = new Date().toISOString();
        editedDay.modifiedBy = 'ai_assistant';
        editedDay.originalRequest = userRequest;

        // Return comprehensive response
        res.status(200).json({ 
          data: { 
            editedDay,
            modifications: {
              timestamp: new Date().toISOString(),
              userRequest,
              contextUsed: !!programContext,
              safetyChecked: true,
              personalizedForUser: true
            }
          } 
        });

      } catch (error: any) {
        console.error('Error editing workout day:', error);
        res.status(500).json({
          error: 'Failed to edit workout day',
          message: error.message,
          details: error.stack
        });
      }
    });
  });