
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
  notes?: unknown;
  strength?: unknown;
  description?: unknown;
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
    
    // Structural validation with more detailed error messages
    if (!dayToModify) {
      throw new Error('Day to modify is required');
    }
    
    if (!modificationPrompt) {
      throw new Error('Please provide modification instructions');
    }

    if (!allWorkouts || typeof allWorkouts !== 'object' || Array.isArray(allWorkouts)) {
      throw new Error('Current workout data is required');
    }

    const currentWorkout = allWorkouts[dayToModify];
    if (!isValidWorkout(currentWorkout)) {
      throw new Error(`Invalid workout structure for ${dayToModify}`);
    }

    console.log('Processing modification request:', {
      day: dayToModify,
      promptLength: modificationPrompt.length,
      workoutKeys: Object.keys(currentWorkout)
    });

    const prompt = `PROFESSIONAL WORKOUT MODIFICATION REQUEST
Specifically modifying: ${dayToModify}
Current Workout Details:
- Description: ${currentWorkout.description || 'No description provided'}
- Warmup: ${currentWorkout.warmup}
- Strength: ${currentWorkout.strength || 'No strength component'}
- Main Workout: ${currentWorkout.workout}
- Notes: ${currentWorkout.notes || 'No additional notes'}

Modification Instructions: "${modificationPrompt}"

REQUIRED ACTIONS:
1. Analyze current workout structure for ${dayToModify}
2. Maintain original workout intent where possible
3. Implement requested changes scientifically
4. Preserve exercise progression logic
5. Add modification rationale in notes
6. Keep the same format as the original workout

STRICT OUTPUT FORMAT (JSON ONLY):
{
  "warmup": "Modified warmup routine",
  "workout": "Updated workout routine",
  "strength": "Updated strength component",
  "notes": "Professional notes and explanations",
  "description": "Brief explanation of changes"
}

CRITICAL RULES:
- Keep the same structure and format as the original workout
- Use double quotes for strings
- No markdown formatting
- No text outside JSON
- Escape special characters
- Focus only on modifying ${dayToModify}, ignore other days`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        topK: 20,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!result.response?.text) {
      throw new Error('Empty response from Gemini API');
    }

    // Clean and parse response
    const rawText = result.response.text();
    console.log('Received raw response:', rawText.substring(0, 100) + '...');
    
    const jsonText = rawText
      .replace(/```(json)?/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const modifiedWorkout = JSON.parse(jsonText);
      
      // Validate response structure
      if (!modifiedWorkout.warmup || !modifiedWorkout.workout || !modifiedWorkout.strength) {
        throw new Error('Invalid modified workout structure from AI');
      }

      console.log('Successfully generated modified workout for:', dayToModify);
      return new Response(JSON.stringify(modifiedWorkout), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }

  } catch (error) {
    console.error(`Error in workout-modifier:`, error);
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
