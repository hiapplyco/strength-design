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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a CrossFit coach helping modify a workout schedule.
Current weekly schedule:
${Object.entries(allWorkouts)
  .map(([day, workout]) => `${day}:
- Warmup: ${workout.warmup}
- WOD: ${workout.wod}
- Notes: ${workout.notes}`)
  .join('\n\n')}

Request: Modify ${dayToModify}'s workout based on this request: "${modificationPrompt}"

Consider the overall weekly schedule and maintain a balanced training program.
Provide the modified workout in this exact format:
WARMUP:
[warmup content]
WOD:
[wod content]
NOTES:
[notes content]`;

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the response into sections
    const sections = {
      warmup: text.match(/WARMUP:\n([\s\S]*?)(?=WOD:)/)?.[1]?.trim() || '',
      wod: text.match(/WOD:\n([\s\S]*?)(?=NOTES:)/)?.[1]?.trim() || '',
      notes: text.match(/NOTES:\n([\s\S]*?)$/)?.[1]?.trim() || '',
    };

    console.log('Parsed response:', sections);

    return new Response(JSON.stringify(sections), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});