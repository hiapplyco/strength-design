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

    const systemPrompt = `Generate a week of CrossFit workouts. Return ONLY a JSON object with the following structure for each day (Sunday through Saturday):
    {
      "Sunday": {
        "description": "Brief overview",
        "warmup": "Detailed warmup",
        "wod": "Main workout",
        "notes": "Additional info"
      },
      // ... repeat for each day
    }
    Consider CrossFit principles of constantly varied, functional movements at high intensity while maintaining proper progression and recovery throughout the week.`;

    const fullPrompt = `${systemPrompt}\n\nAdditional context from coach: ${prompt}`;

    console.log('Generating workouts with prompt:', fullPrompt);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response by removing any markdown formatting
    const jsonStr = text.replace(/```json\n|\n```/g, '').trim();
    
    try {
      // Parse the cleaned JSON string
      const workouts = JSON.parse(jsonStr);
      console.log('Successfully parsed workouts:', workouts);
      
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.log('Raw response:', text);
      throw new Error('Invalid JSON format in AI response');
    }
  } catch (error) {
    console.error('Error generating workouts:', error);
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