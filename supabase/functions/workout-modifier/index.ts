
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();
    console.log('Modifying workout with params:', { dayToModify, modificationPrompt });

    const prompt = `
      I have a workout plan and I want to modify ${dayToModify}'s workout according to this request: "${modificationPrompt}".
      Here's the current workout data: ${JSON.stringify(allWorkouts[dayToModify], null, 2)}
      
      Please modify the workout while maintaining the same JSON structure. Ensure all exercises are realistic and the intensity matches the modification request.
      Return ONLY the modified JSON for ${dayToModify}, maintaining the exact same structure with warmup, workout, and notes fields.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 6000,
        temperature: 0.7
      }
    });

    const response = result.response;
    console.log('Raw response:', response.text());

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.text().replace(/```json\n?|\n?```/g, '').trim());
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse modified workout data');
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error modifying workout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
