import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate workout structure using type predicate
function isValidWorkout(workout: unknown): workout is { 
  warmup: unknown; 
  workout: unknown; 
  notes?: unknown 
} {
  return !!workout && 
         typeof workout === 'object' && 
         'warmup' in workout && 
         'workout' in workout;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable not set');

    const requestData = await req.json().catch(() => {
      throw new Error('Invalid JSON payload');
    });

    const { dayToModify, modificationPrompt, allWorkouts } = requestData;
    
    // Structural validation
    if (typeof dayToModify !== 'string' || !dayToModify.startsWith('day')) {
      throw new Error(`Invalid day format: '${dayToModify}'. Use 'dayX' format`);
    }
    
    if (typeof modificationPrompt !== 'string' || modificationPrompt.length < 10) {
      throw new Error('Modification prompt must be at least 10 characters');
    }

    if (!allWorkouts || typeof allWorkouts !== 'object' || Array.isArray(allWorkouts)) {
      throw new Error('allWorkouts must be an object mapping days to workouts');
    }

    const currentWorkout = allWorkouts[dayToModify];
    if (!isValidWorkout(currentWorkout)) {
      throw new Error(`Invalid workout structure for ${dayToModify}`);
    }

    const prompt = `PROFESSIONAL WORKOUT MODIFICATION REQUEST
Current Day: ${dayToModify}
Original Workout Details:
- Warmup: ${currentWorkout.warmup}
- Main Workout: ${currentWorkout.workout}
- Notes: ${currentWorkout.notes || 'No additional notes'}

Modification Instructions: "${modificationPrompt}"

REQUIRED ACTIONS:
1. Analyze current workout structure
2. Maintain original workout intent where possible
3. Implement requested changes scientifically
4. Preserve exercise progression logic
5. Add modification rationale in notes

STRICT OUTPUT FORMAT (JSON ONLY):
{
  "warmup": ["array", "of", "modified", "warmup", "steps"],
  "workout": ["array", "of", "updated", "exercises"],
  "notes": ["array", "of", "professional", "notes"],
  "description": "string explaining changes"
}

CRITICAL RULES:
- Use double quotes ONLY
- No markdown formatting
- No text outside JSON
- Escape special characters
- Maintain array formatting`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,  // Lowered for more consistent modifications
        topK: 20,
        topP: 0.9,
        maxOutputTokens: 1024,
        response_mime_type: "application/json",
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!result.response?.text) {
      throw new Error('Empty response from Gemini API');
    }

    // Robust JSON extraction with multiple fallbacks
    const rawText = result.response.text();
    const jsonText = rawText
      .replace(/```(json)?/g, '')  // Remove code blocks
      .replace(/[\r\n]+/g, ' ')    // Collapse newlines
      .replace(/\s+/g, ' ')        // Collapse whitespace
      .trim();

    const modifiedWorkout = JSON.parse(jsonText);
    
    // Validate response structure
    if (!modifiedWorkout.warmup || !modifiedWorkout.workout) {
      throw new Error('Invalid modified workout structure from AI');
    }

    return new Response(JSON.stringify(modifiedWorkout), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return new Response(JSON.stringify({
      error: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});