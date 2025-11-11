import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const WORKOUT_GENERATION_PROMPT = `You are an expert fitness coach creating a comprehensive workout program. Generate a structured workout plan based on the user's requirements.

**CRITICAL FORMATTING REQUIREMENTS:**
- Return ONLY valid JSON with the exact structure shown below
- Do NOT include any explanatory text outside the JSON
- Use the exact field names and structure provided
- Ensure all JSON is properly escaped and formatted

Expected JSON Structure:
{
  "title": "Descriptive Program Name",
  "summary": "2-3 sentence overview of the program",
  "duration": "4-12 weeks",
  "difficulty": "beginner|intermediate|advanced",
  "equipment": ["list", "of", "required", "equipment"],
  "targetMuscles": ["chest", "back", "legs", "etc"],
  "goals": ["strength", "muscle gain", "endurance", "etc"],
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Introduction/Base Building/Peak/etc",
      "days": [
        {
          "dayNumber": 1,
          "dayName": "Upper Body Push",
          "muscles": ["chest", "shoulders", "triceps"],
          "estimatedDuration": "45-60 minutes",
          "exercises": [
            {
              "name": "Push-ups",
              "category": "compound",
              "targetMuscles": ["chest", "shoulders", "triceps"],
              "sets": 3,
              "reps": "8-12",
              "rest": "60-90 seconds",
              "weight": "bodyweight",
              "instructions": ["Step by step form cues"],
              "modifications": {
                "easier": "Knee push-ups",
                "harder": "Decline push-ups"
              }
            }
          ]
        }
      ]
    }
  ],
  "tips": [
    "Important training principles",
    "Progression guidelines",
    "Recovery recommendations"
  ]
}

Generate a complete program with appropriate progression across weeks.`;

export const generateStructuredWorkout = onRequest(
  { 
    secrets: [geminiApiKey],
    cors: ["*"],
    maxInstances: 10,
    timeoutSeconds: 540
  }, 
  async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      try {
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
          console.error("GEMINI_API_KEY not configured");
          res.status(500).json({ error: "Service configuration error" });
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const data = req.body.data || req.body;
        const { 
          userRequirements,
          fitnessLevel = 'intermediate',
          daysPerWeek = 3,
          weeksTotal = 4,
          equipment = [],
          goals = [],
          injuries = [],
        } = data;

        console.log("Generating structured workout for:", {
          fitnessLevel,
          daysPerWeek,
          weeksTotal,
          goals
        });

        const prompt = `${WORKOUT_GENERATION_PROMPT}

USER REQUIREMENTS:
- Fitness Level: ${fitnessLevel}
- Days per week: ${daysPerWeek}
- Total weeks: ${weeksTotal}
- Available equipment: ${equipment.join(', ') || 'bodyweight only'}
- Goals: ${goals.join(', ') || 'general fitness'}
- Injuries/limitations: ${injuries.join(', ') || 'none'}
- Additional preferences: ${userRequirements || 'none specified'}

Create a progressive ${weeksTotal}-week program with ${daysPerWeek} training days per week.`;

        const generationConfig = {
          maxOutputTokens: 8192,
          temperature: 0.3, // Lower temperature for more structured output
          topP: 0.8,
        };

        const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ];

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
          safetySettings,
        });

        const response = result.response.text();
        console.log("Raw AI response:", response.substring(0, 500) + "...");

        try {
          // Extract JSON from response (in case there's extra text)
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : response;
          
          const workoutData = JSON.parse(jsonStr);
          
          // Validate structure
          if (!workoutData.weeks || !Array.isArray(workoutData.weeks)) {
            throw new Error("Invalid workout structure: missing weeks array");
          }

          console.log("Generated workout with", workoutData.weeks.length, "weeks");

          res.status(200).json({ 
            data: {
              success: true,
              workout: workoutData,
              generatedAt: new Date().toISOString()
            }
          });

        } catch (parseError) {
          console.error("Failed to parse workout JSON:", parseError);
          console.error("Raw response:", response);
          
          // Fallback: return a basic structure
          res.status(200).json({ 
            data: {
              success: false,
              error: "Failed to parse workout structure",
              rawResponse: response,
              fallback: true
            }
          });
        }

      } catch (error: any) {
        console.error("Error in generateStructuredWorkout:", error);
        res.status(500).json({ 
          error: error.message,
          details: "Failed to generate structured workout"
        });
      }
    });
  }
);