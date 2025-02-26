
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting workout generation...');
    const params = await req.json();
    console.log('Received params:', params);

    // Construct a more detailed prompt
    const fullPrompt = `Generate a comprehensive ${params.numberOfDays}-day workout plan with the following specifications:

FITNESS PROFILE:
- Level: ${params.fitnessLevel}
- Weather Considerations: ${params.weatherPrompt || 'None specified'}
- Prescribed Exercises/Focus: ${params.prescribedExercises}

REQUIREMENTS:
For each day (day1 through day${params.numberOfDays}), provide:
1. A description of the day's focus
2. A warmup routine
3. The main workout with specific exercises
4. A strength component
5. Additional notes if relevant

Format the response as valid JSON following this exact structure:
{
  "day1": {
    "description": "Focus of the day",
    "warmup": "Detailed warmup",
    "workout": "Main workout details",
    "strength": "Strength component",
    "notes": "Additional notes"
  },
  // ... repeat for each day
}`;

    console.log('Sending prompt to Gemini:', fullPrompt);

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
    console.log('Raw response:', responseText);

    // Try to find and parse JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const workoutData = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    const expectedDays = Array.from({ length: params.numberOfDays }, (_, i) => `day${i + 1}`);
    const missingDays = expectedDays.filter(day => !workoutData[day]);
    
    if (missingDays.length > 0) {
      throw new Error(`Missing workouts for days: ${missingDays.join(', ')}`);
    }

    // Validate each day has required fields
    Object.entries(workoutData).forEach(([day, workout]: [string, any]) => {
      const requiredFields = ['description', 'warmup', 'workout', 'strength'];
      const missingFields = requiredFields.filter(field => !workout[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Day ${day} is missing required fields: ${missingFields.join(', ')}`);
      }
    });

    console.log('Successfully validated workout data');

    return new Response(
      JSON.stringify(workoutData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error generating workout:', error);
    console.error('Error details:', error.stack);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate workout',
        message: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
