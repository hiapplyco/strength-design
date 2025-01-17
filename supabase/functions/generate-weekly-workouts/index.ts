import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

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
    const { prompt } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are a CrossFit coach generating a week of workouts. Return a valid JSON object with NO markdown formatting. The structure must be exactly:
{
  "Sunday": {
    "description": "string with brief overview",
    "warmup": "string with detailed warmup",
    "wod": "string with main workout",
    "notes": "string with additional info"
  },
  "Monday": { same structure },
  "Tuesday": { same structure },
  "Wednesday": { same structure },
  "Thursday": { same structure },
  "Friday": { same structure },
  "Saturday": { same structure }
}

Important: Return ONLY the JSON object, no other text or markdown formatting.`;

    const fullPrompt = `${systemPrompt}\n\nAdditional context from coach: ${prompt || 'Create a balanced week of workouts'}`;

    console.log('Sending prompt to Gemini:', fullPrompt);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw response from Gemini:', text);

    // Clean the response: remove any potential markdown and extra whitespace
    const cleanedText = text
      .replace(/```json\n?|\n?```/g, '') // Remove markdown code blocks
      .replace(/^\s+|\s+$/g, '')         // Remove leading/trailing whitespace
      .replace(/\\n/g, ' ')              // Replace escaped newlines with spaces
      .replace(/\n/g, ' ');              // Replace actual newlines with spaces

    console.log('Cleaned text:', cleanedText);

    try {
      // Attempt to parse the cleaned JSON
      const workouts = JSON.parse(cleanedText);

      // Validate the structure
      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'warmup', 'wod', 'notes'];

      // Check if all required days and fields are present
      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        throw new Error('Generated JSON is missing required days or fields');
      }

      console.log('Successfully validated workouts:', workouts);
      
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing or validating JSON:', parseError);
      console.log('Failed to parse text:', cleanedText);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format',
          details: parseError.message,
          rawResponse: text.substring(0, 200) + '...' // First 200 chars for debugging
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate or parse workouts'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});