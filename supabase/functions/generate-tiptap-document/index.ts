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

    const prompt = `You are a professional fitness document formatter. Format the following workout data into a structured TipTap document. Follow these guidelines strictly:

    1. Create a document with proper sections using Tiptap nodes
    2. Use appropriate emojis for different sections
    3. Format exercises with bold text
    4. Include form tips with the 💡 emoji
    5. Use bullet lists for sets and reps
    6. Add intensity indicators where appropriate
    7. Structure the document with proper heading hierarchy

    The output should be a valid JSON object following this structure:
    {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [{ "type": "text", "text": "Workout Overview" }]
        },
        // Additional content following Tiptap schema
      ]
    }

    Here's the workout data to format:
    ${JSON.stringify(workouts, null, 2)}

    Important:
    - Use only valid Tiptap nodes (doc, heading, paragraph, bulletList, listItem, text)
    - Include marks for bold and italic text where appropriate
    - Ensure proper nesting of nodes
    - Return only the JSON structure, no additional text
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let formattedContent;
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.text().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        formattedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      throw new Error("Failed to parse workout format");
    }

    return new Response(JSON.stringify(formattedContent), {
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