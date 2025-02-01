import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workouts } = await req.json();
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional fitness document formatter. Format the following workout data into a structured document suitable for a rich text editor. Follow these guidelines strictly:

1. Use HTML-like formatting:
   - Use <h1> for main headings
   - Use <h2> for subheadings
   - Use <p> for paragraphs
   - Use <ul> and <li> for lists
   - Use <strong> for emphasis
2. Include emojis for visual appeal
3. Format exercises in <strong> tags
4. Include form tips with the 💡 emoji
5. Use bullet points for sets and reps
6. Add intensity indicators where appropriate
7. Structure the document with proper heading hierarchy

Here's the workout data to format:
${JSON.stringify(workouts, null, 2)}

Important:
- Use proper HTML tags for structure
- Return only the formatted HTML text
- Include clear section breaks between different parts of the workout
- Make sure all HTML tags are properly closed
`;

    const result = await model.generateContent(prompt);
    const formattedContent = result.response.text();
    
    console.log("Generated HTML content:", formattedContent);

    return new Response(JSON.stringify({ content: formattedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-tiptap-document function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handleRequest);