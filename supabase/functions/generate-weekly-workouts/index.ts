
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "./prompts.ts";

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
    const { prompt, weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();
    console.log('Generating workout with params:', { prompt, weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays });

    const fullPrompt = buildPrompt({
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    });

    console.log('Using prompt:', fullPrompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
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
      throw new Error('Failed to parse workout data');
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error generating workout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
