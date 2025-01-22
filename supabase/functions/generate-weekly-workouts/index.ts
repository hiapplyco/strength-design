import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", 
  "Saturday", "Sunday", "Day 8", "Day 9", "Day 10", 
  "Day 11", "Day 12"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting workout generation process...");
    const startTime = Date.now();
    
    const { prompt, numberOfDays = 7 } = await req.json();
    console.log("Received prompt:", prompt);
    console.log("Number of days requested:", numberOfDays);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const expertPrompt = `You are a world-renowned coach and movement specialist with over 25 years of experience in athletic development, movement optimization, and performance enhancement. Your expertise spans across multiple domains including Olympic weightlifting, powerlifting, gymnastics, calisthenics, sport-specific conditioning, rehabilitation, injury prevention, movement screening and assessment, periodization and program design, and mental performance coaching.

Based on your extensive expertise, create a comprehensive ${numberOfDays}-day progression plan considering this context: ${prompt}

For each training day, provide:

1. STRATEGIC OVERVIEW:
   - Day's specific focus
   - Connection to overall skill development
   - Expected adaptation and progress markers

2. DETAILED WARMUP PROTOCOL:
   - Movement preparation sequence
   - Mobility/stability work
   - Progressive intensity building
   - Skill-specific activation drills

3. MAIN WORKOUT:
   - Clear movement standards
   - Loading parameters with rationale
   - Work-to-rest ratios
   - Intensity guidelines
   - Progression options

4. COACHING NOTES:
   - Technical execution priorities
   - Common faults and corrections
   - Performance metrics
   - Recovery considerations

5. STRENGTH DEVELOPMENT:
   - Primary movement patterns
   - Loading schemes
   - Tempo guidelines
   - Accessory work

Return the response in this exact JSON format for ${numberOfDays} days:
{
  "[Day Name]": {
    "description": "Brief overview of the day's focus",
    "warmup": "Detailed warmup protocol",
    "workout": "Main workout details",
    "strength": "Strength work details",
    "notes": "Coaching notes and considerations"
  }
}`;

    console.log("Sending prompt to Gemini...");
    const result = await model.generateContent(expertPrompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received response from Gemini");

    let workouts;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      workouts = JSON.parse(jsonMatch[0]);
      
      // Ensure we only return the requested number of days
      const limitedWorkouts: Record<string, any> = {};
      Object.entries(workouts)
        .slice(0, numberOfDays)
        .forEach(([key, value], index) => {
          limitedWorkouts[DAYS_OF_WEEK[index]] = value;
        });
      
      workouts = limitedWorkouts;
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      throw new Error("Failed to parse workout data");
    }

    const endTime = Date.now();
    console.log(`Workout generation completed in ${endTime - startTime}ms`);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});