import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();
    console.log('Received request to modify workout:', { dayToModify, modificationPrompt });

    if (!allWorkouts || !allWorkouts[dayToModify]) {
      throw new Error('No workout data provided for modification');
    }

    const currentWorkout = allWorkouts[dayToModify];

    const prompt = `
As an expert coach with deep expertise in exercise programming and movement optimization, modify this workout based on the following request while maintaining its core purpose and progression:

CURRENT WORKOUT FOR ${dayToModify}:
Description: ${currentWorkout.description}
Warmup: ${currentWorkout.warmup}
Workout: ${currentWorkout.workout}
Strength Focus: ${currentWorkout.strength}
Coaching Notes: ${currentWorkout.notes || 'None provided'}

MODIFICATION REQUEST: ${modificationPrompt}

Consider:
1. Movement pattern integrity
2. Exercise progression/regression needs
3. Equipment modifications
4. Safety and technique priorities
5. Energy system demands
6. Recovery implications

Provide a complete, modified workout that includes ALL of the following sections:

1. Brief description explaining focus and stimulus
2. Detailed warmup sequence
3. Complete workout with:
   - Clear movement standards
   - Loading parameters
   - Work/rest ratios
   - Scaling options
4. Strength focus with specific movement patterns
5. Comprehensive coaching notes

Return ONLY a JSON object with the modified workout in this exact format:
{
    "description": "Brief workout description",
    "warmup": "Detailed warmup plan",
    "workout": "Complete workout details",
    "notes": "Comprehensive coaching notes",
    "strength": "Specific strength focus"
}

Ensure all sections are detailed and complete, maintaining the professional coaching standard of the original workout.`;

    console.log('Sending prompt to Gemini:', prompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const text = response.text();
    console.log('Received response from Gemini:', text);

    try {
      const cleanedText = text
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\\n/g, ' ')
        .replace(/\n/g, ' ');

      console.log('Cleaned response:', cleanedText);
      
      const modifiedWorkout = JSON.parse(cleanedText);
      console.log('Parsed workout:', modifiedWorkout);

      // Validate all required fields are present and non-empty
      const requiredFields = ['description', 'warmup', 'workout', 'notes', 'strength'];
      const isValid = requiredFields.every(field => 
        typeof modifiedWorkout[field] === 'string' && modifiedWorkout[field].length > 0
      );

      if (!isValid) {
        console.error('Invalid workout structure:', modifiedWorkout);
        throw new Error('Generated workout is missing required fields');
      }

      return new Response(JSON.stringify(modifiedWorkout), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in workout-modifier function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to modify workout'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});