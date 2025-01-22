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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const expertPrompt = `You are a world-renowned coach and movement specialist with over 25 years of experience in athletic development, movement optimization, and performance enhancement. Your expertise spans across multiple domains including Olympic weightlifting, powerlifting, gymnastics, calisthenics, sport-specific conditioning, rehabilitation, injury prevention, movement screening and assessment, periodization and program design, and mental performance coaching.

Based on your extensive expertise, create a comprehensive ${numberOfDays}-day progression plan considering this context: ${prompt}

${weatherContext}
${exercisesContext}
${fitnessContext}

PROGRAMMING PRINCIPLES TO CONSIDER:
1. Progressive Overload
   - Systematic increase in training demands
   - Volume and intensity management
   - Technical complexity progression
   - Recovery requirements

2. Movement Pattern Balance
   - Push/pull ratios
   - Anterior/posterior chain development
   - Rotational/anti-rotational work
   - Unilateral/bilateral balance

3. Energy System Development
   - Aerobic capacity building
   - Anaerobic power development
   - Work-to-rest ratios
   - Metabolic conditioning

4. Injury Prevention
   - Joint preparation and mobility work
   - Tissue loading strategies
   - Movement pattern reinforcement
   - Recovery protocols

5. Skill Acquisition
   - Technical progression
   - Motor learning principles
   - Feedback mechanisms
   - Success metrics

For each training day, provide:

1. STRATEGIC OVERVIEW:
   - Day's specific focus within weekly progression
   - Connection to overall skill development
   - Expected adaptation and progress markers
   - Integration with previous/future sessions

2. DETAILED WARMUP PROTOCOL:
   - Movement preparation sequence
   - Mobility/stability work specific to the day's focus
   - Progressive intensity building
   - Skill-specific activation drills
   - Neural preparation elements

3. MAIN WORKOUT:
   - Clear movement standards and technique requirements
   - Loading parameters with scientific rationale
   - Work-to-rest ratios based on energy system demands
   - Intensity guidelines with RPE recommendations
   - Progression and regression options
   - Time domains with physiological justification

4. COMPREHENSIVE COACHING NOTES:
   - Technical execution priorities
   - Common faults and correction strategies
   - Performance metrics and success indicators
   - Recovery considerations and management
   - Mental preparation strategies
   - Long-term progression markers
   - Safety considerations and contraindications

5. STRENGTH DEVELOPMENT:
   - Primary movement patterns
   - Loading schemes with scientific backing
   - Tempo and execution guidelines
   - Accessory work recommendations
   - Specific weakness addressing strategies
   - Integration with skill work

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
    
    const result = await model.generateContent(expertPrompt);
    console.log("Received response from Gemini");
    
    const response = await result.response;
    const text = response.text();
    console.log("Response text length:", text.length);

    let workouts;
    try {
      console.log("Parsing response as JSON...");
      try {
        workouts = JSON.parse(text);
      } catch (e) {
        console.log("Initial JSON parse failed, attempting to extract JSON from text...");
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("No JSON found in response");
          throw new Error("No JSON found in response");
        }
        workouts = JSON.parse(jsonMatch[0]);
      }
      
      if (!workouts || typeof workouts !== 'object') {
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
      
      workouts = limitedWorkouts;
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      console.error("Raw response:", text);
      throw new Error(`Failed to parse workout data: ${error.message}`);
    }

    const endTime = Date.now();
    console.log(`Workout generation completed in ${endTime - startTime}ms`);
    console.log("Generated workouts:", JSON.stringify(workouts, null, 2));

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