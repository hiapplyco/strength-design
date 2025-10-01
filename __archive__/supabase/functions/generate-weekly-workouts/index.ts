
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createWorkoutGenerationPrompt } from "../shared/prompts.ts";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    console.log('Received params:', JSON.stringify(params, null, 2));

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
    console.log('Raw response:', responseText.substring(0, 200) + '...'); // Log a sample of the response

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
        responseLength: responseText.length,
        fullPromptUsed: fullPrompt  // Include the full prompt in debug data
      }
    };

    return new Response(
      JSON.stringify(responseData),
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
