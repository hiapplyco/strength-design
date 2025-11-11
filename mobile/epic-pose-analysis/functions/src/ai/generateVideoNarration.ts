import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const NARRATION_PROMPT = `You are a fitness influencer creating an engaging video script for social media. 
Create a 60-second narration script based on the provided workout plan.

IMPORTANT RULES:
1. Create exactly 12 segments for a 60-second video (5 seconds each)
2. Each segment should be 10-15 words maximum (speakable in 5 seconds)
3. Make it personal, motivational, and engaging
4. Reference specific exercises from the workout
5. Use enthusiastic but natural language
6. Include hooks to keep viewers watching
7. End with a call-to-action

OUTPUT FORMAT:
Return a JSON array with exactly 12 objects, each containing:
{
  "time": <seconds>,
  "text": "<narration text>",
  "emotion": "excited|motivational|informative|inspiring|energetic"
}

The times should be: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55`;

export const generateVideoNarration = onRequest({
  timeoutSeconds: 60,
  memory: "512MiB",
  secrets: [geminiApiKey],
  cors: true
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { workout, customPrompt, tone = "motivational", focusArea } = req.body;
    
    if (!workout) {
      res.status(400).json({ error: "Workout data is required" });
      return;
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      res.status(500).json({ error: "Service configuration error" });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build workout context
    let workoutContext = `
WORKOUT DETAILS:
Title: ${workout.title || 'Custom Workout'}
Duration: ${workout.duration || '4 weeks'}
Difficulty: ${workout.difficulty || 'intermediate'}
Equipment: ${workout.equipment?.join(', ') || 'bodyweight'}
Target Muscles: ${workout.targetMuscles?.join(', ') || 'full body'}
Goals: ${workout.goals?.join(', ') || 'general fitness'}
`;

    // Add specific exercises if available
    if (workout.weeks && workout.weeks.length > 0) {
      const firstWeek = workout.weeks[0];
      if (firstWeek.days && firstWeek.days.length > 0) {
        const exercises = firstWeek.days[0].exercises || [];
        const exerciseNames = exercises.slice(0, 5).map((e: any) => e.name).join(', ');
        workoutContext += `\nKey Exercises: ${exerciseNames}`;
      }
    }

    // Add custom instructions if provided
    let additionalInstructions = "";
    if (customPrompt) {
      additionalInstructions = `\nADDITIONAL INSTRUCTIONS FROM USER: ${customPrompt}`;
    }
    if (tone) {
      additionalInstructions += `\nTONE: Be ${tone} in your delivery`;
    }
    if (focusArea) {
      additionalInstructions += `\nFOCUS: Emphasize ${focusArea} in the narration`;
    }

    const fullPrompt = `${NARRATION_PROMPT}

${workoutContext}
${additionalInstructions}

Create an engaging 60-second video narration script that will make viewers want to try this workout.`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    
    console.log("Raw narration response:", response);

    // Parse the JSON response
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const narrationSegments = JSON.parse(jsonStr);
      
      // Validate and ensure we have exactly 12 segments
      if (!Array.isArray(narrationSegments)) {
        throw new Error("Invalid response format");
      }
      
      // Ensure we have exactly 12 segments with correct timing
      const times = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const validatedSegments = times.map((time, index) => {
        const segment = narrationSegments[index] || {
          text: index === 0 ? "Hey fitness fam! Let's crush this workout!" : 
                index === 11 ? "Drop a comment if you're ready to start!" : 
                "Keep pushing, you've got this!",
          emotion: "motivational"
        };
        
        return {
          time,
          text: segment.text,
          emotion: segment.emotion || "motivational"
        };
      });

      res.status(200).json({ 
        success: true,
        narration: validatedSegments,
        metadata: {
          workoutTitle: workout.title,
          duration: 60,
          segmentCount: 12,
          tone: tone
        }
      });

    } catch (parseError) {
      console.error("Failed to parse narration JSON:", parseError);
      
      // Fallback narration
      const fallbackNarration = [
        { time: 0, text: "Hey everyone! Ready for an amazing workout?", emotion: "excited" },
        { time: 5, text: `Today's ${workout.title || 'workout'} is gonna be fire!`, emotion: "energetic" },
        { time: 10, text: `It's a ${workout.difficulty || 'challenging'} ${workout.duration || 'program'}`, emotion: "informative" },
        { time: 15, text: "Perfect for building strength and endurance", emotion: "motivational" },
        { time: 20, text: `We'll target ${workout.targetMuscles?.[0] || 'full body'}`, emotion: "informative" },
        { time: 25, text: "No excuses, just results!", emotion: "motivational" },
        { time: 30, text: "I've been doing this for weeks", emotion: "inspiring" },
        { time: 35, text: "The transformation is incredible!", emotion: "excited" },
        { time: 40, text: "You only need minimal equipment", emotion: "informative" },
        { time: 45, text: "Join me on this fitness journey", emotion: "inspiring" },
        { time: 50, text: "Save this workout for later!", emotion: "energetic" },
        { time: 55, text: "Comment 'LET'S GO' if you're in!", emotion: "excited" }
      ];
      
      res.status(200).json({ 
        success: true,
        narration: fallbackNarration,
        metadata: {
          workoutTitle: workout.title,
          duration: 60,
          segmentCount: 12,
          tone: tone,
          fallback: true
        }
      });
    }

  } catch (error: any) {
    console.error("Error generating narration:", error);
    res.status(500).json({ 
      error: error.message,
      details: "Failed to generate video narration"
    });
  }
});