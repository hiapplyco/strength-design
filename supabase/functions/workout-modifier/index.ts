
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

      Current workout for ${dayToModify || "today"}:
      ${JSON.stringify(currentWorkout, null, 2)}

      Guidelines:
      1. Keep the same structure (warmup, workout, notes, strength)
      2. Make changes that align with the modification request
      3. Consider the overall weekly workout plan context
      4. Maintain realistic and safe exercise modifications
      5. Return only JSON with no markdown code blocks or extra text
      6. Include all fields from the original workout (warmup, workout, notes, strength)

      Your response should be valid JSON only, with no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('AI response:', text);

    // Try to parse the response as JSON
    try {
      // Remove any markdown code block indicators if present
      let cleanedText = text.replace(/```json|```/g, '').trim();
      
      const modifiedWorkout = JSON.parse(cleanedText);
      
      return new Response(JSON.stringify(modifiedWorkout), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Return a formatted error that can be handled by the client
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          message: "The AI returned an invalid format. Please try again with a clearer modification request.",
          details: parseError.message
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
