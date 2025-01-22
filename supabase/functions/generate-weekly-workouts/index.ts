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
  console.log("Function started");
  
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body");
    const { prompt, numberOfDays = 7 } = await req.json();
    console.log("Request parameters:", { prompt, numberOfDays });

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found");
      throw new Error('GEMINI_API_KEY is not set');
    }
    console.log("GEMINI_API_KEY found");

    console.log("Initializing Gemini AI");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const generationConfig = {
      temperature: 0.9,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    };

    console.log("Creating chat session");
    const chat = model.startChat({
      generationConfig,
      history: [],
    });

    const expertPrompt = `You are a world-renowned coach and movement specialist. Create a ${numberOfDays}-day workout plan based on this context: ${prompt}

Return ONLY a valid JSON object with no additional text, following this exact format for ${numberOfDays} days:
{
  "[Day Name]": {
    "description": "Brief overview of the day's focus (1-2 sentences)",
    "warmup": "Detailed warmup protocol (2-3 paragraphs)",
    "workout": "Main workout details (2-3 paragraphs)",
    "strength": "Strength work details (1-2 paragraphs)",
    "notes": "Coaching notes and considerations (1-2 paragraphs)"
  }
}

Important:
1. Use the exact field names shown above
2. Return ONLY the JSON object, no other text
3. Ensure the JSON is properly formatted and valid
4. Include exactly ${numberOfDays} days
5. Use realistic workout progressions`;

    console.log("Sending prompt to Gemini");
    console.log("Prompt length:", expertPrompt.length);
    
    const result = await Promise.race([
      chat.sendMessage(expertPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API request timeout')), 25000)
      )
    ]);

    console.log("Received response from Gemini");
    const text = result.response.text();
    console.log("Raw response length:", text.length);
    console.log("Raw response preview:", text.substring(0, 200));

    let workouts;
    try {
      console.log("Parsing response as JSON");
      workouts = JSON.parse(text);
      console.log("Successfully parsed JSON");
      console.log("Number of days in response:", Object.keys(workouts).length);
    } catch (error) {
      console.error("Failed to parse initial JSON:", error);
      console.log("Attempting to extract JSON from text");
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response");
        throw new Error("Failed to generate valid workout data");
      }
      
      try {
        workouts = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed extracted JSON");
      } catch (error) {
        console.error("Failed to parse extracted JSON:", error);
        throw new Error("Invalid workout data format");
      }
    }

    if (!workouts || typeof workouts !== 'object') {
      console.error("Invalid workout data structure:", workouts);
      throw new Error("Invalid workout data structure");
    }

    const limitedWorkouts: Record<string, any> = {};
    Object.entries(workouts)
      .slice(0, numberOfDays)
      .forEach(([key, value], index) => {
        const dayName = DAYS_OF_WEEK[index];
        console.log(`Processing workout for ${dayName}`);
        
        if (!value || typeof value !== 'object') {
          throw new Error(`Invalid structure for day ${key}`);
        }
        
        const required = ['description', 'warmup', 'workout', 'strength', 'notes'];
        for (const field of required) {
          if (!(field in value)) {
            throw new Error(`Missing required field '${field}' for day ${key}`);
          }
        }
        
        limitedWorkouts[dayName] = value;
      });

    console.log("Successfully processed all workouts");
    console.log("Final number of days:", Object.keys(limitedWorkouts).length);
    
    return new Response(JSON.stringify(limitedWorkouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    
    if (error.message === 'API request timeout') {
      return new Response(JSON.stringify({ 
        error: 'Request timed out',
        details: 'The workout generation took too long to complete'
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate workout data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});