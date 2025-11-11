
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Format this workout data into a well-structured HTML document for a rich text editor. Follow these guidelines exactly:

1. Use semantic HTML tags:
   - <h1> for the main title "Weekly Workout Plan"
   - <h2> for each day (e.g., "Day 1")
   - <h3> for section headings (Focus, Warmup, Strength, etc.)
   - <ul> and <li> for exercise lists
   - <p> for descriptions and notes
2. Add emojis for visual appeal:
   - 💪 for Strength sections
   - 🏃‍♂️ for Warmup sections
   - 🎯 for Focus sections
   - 🏋️‍♂️ for Workout sections
   - 📝 for Notes sections
3. Structure each day like this:
   <h2>Day X</h2>
   <h3>🎯 Focus</h3>
   <p>[focus content]</p>
   <h3>🏃‍♂️ Warmup</h3>
   <ul>
     <li>[warmup exercises]</li>
   </ul>
   [continue for other sections]
4. Format exercise specifications clearly:
   - List sets, reps, and weights on separate lines
   - Use bullet points for individual exercises
   - Include rest periods and tempo notes

Here's the workout data to format:
${JSON.stringify(workouts, null, 2)}

Important:
- Use proper HTML structure
- Make the content easy to read
- Include all workout details
- Ensure proper spacing between sections
- Use semantic HTML5 tags only
`;

    const result = await model.generateContent(prompt);
    const formattedContent = result.response.text();
    
    // Clean up any markdown code block syntax that might be present
    const cleanedContent = formattedContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    return new Response(JSON.stringify({ content: cleanedContent }), {
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
