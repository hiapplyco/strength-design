import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dayToModify, modificationPrompt, currentWorkout } = await req.json();
    console.log('Received modification request for:', dayToModify);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    console.log('Initializing Gemini API');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('Model initialized');

    const prompt = `Modify this workout for ${dayToModify}:
Current workout:
${JSON.stringify(currentWorkout, null, 2)}

Modification request: ${modificationPrompt}

Return a JSON object with: warmup, workout, notes, description, and strength fields.`;

    const result = await model.generateContent(prompt);
    console.log('Content generated');

    if (!result?.response) throw new Error('No response from Gemini');

    const text = result.response.text();
    const modifiedWorkout = JSON.parse(text.trim());

    return new Response(
      JSON.stringify(modifiedWorkout),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Workout modification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});