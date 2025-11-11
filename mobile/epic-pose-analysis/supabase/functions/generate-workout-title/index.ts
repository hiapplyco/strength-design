
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { prompt, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flashflash" });

    // Create a rich context for title generation
    const titlePrompt = `
      Create a catchy, fun, and creative title for a ${numberOfDays}-day workout program.
      
      Details about the workout:
      - Fitness level: ${fitnessLevel || 'Not specified'}
      - User's request: ${prompt || 'Not specified'}
      - Number of days: ${numberOfDays}
      ${prescribedExercises ? `- Includes exercises like: ${prescribedExercises.substring(0, 100)}...` : ''}
      
      Guidelines for the title:
      - Create a CATCHY, FUN title that captures the essence of this workout
      - Keep it concise (3-7 words)
      - Make it motivational and inspiring
      - You can use wordplay, alliteration, or puns
      - Don't use generic titles like "7-Day Fitness Program"
      - Include a fitness-related word
      - Don't include emojis
      
      Output the title only, with no quotes or explanation.
    `;

    // Generate title with Gemini
    const result = await model.generateContent(titlePrompt);
    const title = result.response.text().trim();
    
    console.log("Generated workout title:", title);

    // Return the generated title
    return new Response(
      JSON.stringify({
        title: title,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error generating workout title:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        title: "Power Program" // Fallback title in case of error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
