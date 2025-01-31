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
    const { workouts } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional fitness document formatter. Format the following workout data into a structured markdown document. Follow these guidelines strictly:

    1. Use proper markdown syntax with # for main headings and ## for subheadings
    2. Use emojis for different sections
    3. Format exercises in **bold**
    4. Include form tips with the 💡 emoji
    5. Use bullet points for sets and reps
    6. Add intensity indicators where appropriate
    7. Structure the document with proper heading hierarchy

    Here's the workout data to format:
    ${JSON.stringify(workouts, null, 2)}

    Important:
    - Use proper markdown syntax
    - Return only the formatted markdown text, no additional text or JSON structure
    - Include clear section breaks between different parts of the workout
    `;

    const result = await model.generateContent(prompt);
    const markdownContent = result.response.text();
    
    console.log('Generated markdown content:', markdownContent);

    return new Response(JSON.stringify({ content: markdownContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-tiptap-document function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});