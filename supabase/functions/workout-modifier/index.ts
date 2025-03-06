
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    const { dayToModify, currentWorkout, modificationPrompt, allWorkouts } = await req.json();

    console.log('Received request:', { dayToModify, currentWorkout, modificationPrompt });

    const prompt = `
      Please modify this workout according to this request: "${modificationPrompt}"

      Current workout for ${dayToModify}:
      ${JSON.stringify(currentWorkout, null, 2)}

      Guidelines:
      1. Keep the same structure (warmup, workout, notes, strength)
      2. Make changes that align with the modification request
      3. Consider the overall weekly workout plan context
      4. Maintain realistic and safe exercise modifications
      5. Return only the modified workout object in valid JSON format

      Return ONLY the modified JSON for the workout, with no additional text, code blocks, or explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('AI response:', text);

    // Try to parse the response as JSON
    try {
      const modifiedWorkout = JSON.parse(text);
      
      return new Response(JSON.stringify(modifiedWorkout), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Invalid response format from AI');
    }

  } catch (error) {
    console.error('Error in workout-modifier:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        message: "Failed to modify workout. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
