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
    
    const { prompt, numberOfDays = 7, weatherData, selectedExercises, fitnessLevel, prescribedExercises } = await req.json();
    
    // Detailed logging of all inputs
    console.log("Input validation:");
    console.log("- Prompt:", prompt || "Not provided");
    console.log("- Number of days:", numberOfDays);
    console.log("- Weather data:", weatherData || "Not provided");
    console.log("- Selected exercises:", selectedExercises?.length || 0, "exercises");
    console.log("- Fitness level:", fitnessLevel || "Not provided");
    console.log("- Prescribed exercises:", prescribedExercises || "Not provided");

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables");
      throw new Error('GEMINI_API_KEY is not set');
    }

    console.log("Initializing Gemini AI...");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const weatherContext = weatherData ? `
    WEATHER CONSIDERATIONS:
    - Current conditions: ${weatherData.current}
    - Temperature range: ${weatherData.tempRange}
    - Precipitation chance: ${weatherData.precipitation}
    - Air quality: ${weatherData.airQuality}
    - UV index: ${weatherData.uvIndex}
    - Wind conditions: ${weatherData.wind}
    ` : '';

    const exercisesContext = selectedExercises?.length > 0 ? `
    EQUIPMENT AND EXERCISES AVAILABLE:
    ${selectedExercises.map(exercise => `
    - ${exercise.name}:
      Instructions: ${exercise.instructions}
      Equipment needed: ${exercise.equipment}
      Primary muscles: ${exercise.primaryMuscles}
      Force: ${exercise.force}
    `).join('\n')}
    ` : '';

    const fitnessContext = fitnessLevel ? `
    FITNESS PROFILE:
    - Current level: ${fitnessLevel}
    - Special considerations: ${prescribedExercises || 'None'}
    ` : '';

    const expertPrompt = `You are a world-renowned coach and movement specialist. Your task is to create a ${numberOfDays}-day workout plan based on this context: ${prompt}

${weatherContext}
${exercisesContext}
${fitnessContext}

For each training day, provide a JSON object with:
1. description: Brief overview of the day's focus
2. warmup: Detailed warmup protocol
3. workout: Main workout details
4. strength: Strength work details
5. notes: Coaching notes and considerations

Return ONLY a valid JSON object with no additional text, following this exact format for ${numberOfDays} days:
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
    console.log("Prompt length:", expertPrompt.length);
    
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    console.log("Chat session created, sending message...");
    const result = await chatSession.sendMessage(expertPrompt);
    console.log("Received response from Gemini");
    
    const text = result.response.text();
    console.log("Raw response:", text);
    console.log("Response text length:", text.length);

    let workouts;
    try {
      console.log("Attempting to parse response as JSON...");
      workouts = JSON.parse(text);
      console.log("Successfully parsed JSON response");
    } catch (error) {
      console.error("Failed to parse initial JSON response:", error);
      console.log("Attempting to extract JSON from text...");
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response");
        throw new Error("Failed to generate valid workout data. Please try again.");
      }
      
      try {
        workouts = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed extracted JSON");
      } catch (error) {
        console.error("Failed to parse extracted JSON:", error);
        throw new Error("Invalid workout data format. Please try again.");
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
        if (!value || typeof value !== 'object') {
          throw new Error(`Invalid structure for day ${key}`);
        }
        
        const required = ['description', 'warmup', 'workout', 'strength', 'notes'];
        for (const field of required) {
          if (!(field in value)) {
            throw new Error(`Missing required field '${field}' for day ${key}`);
          }
        }
        
        limitedWorkouts[DAYS_OF_WEEK[index]] = value;
      });

    const endTime = Date.now();
    console.log(`Workout generation completed in ${endTime - startTime}ms`);
    console.log("Generated workouts:", JSON.stringify(limitedWorkouts, null, 2));

    return new Response(JSON.stringify(limitedWorkouts), {
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