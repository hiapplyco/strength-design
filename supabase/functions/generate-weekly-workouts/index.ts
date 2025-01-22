import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanJsonText = (text: string): string => {
  return text
    .replace(/```json\s*|\s*```/g, '')           
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')     
    .replace(/,(\s*[}\]])/g, '$1')               
    .replace(/\s+/g, ' ')                        
    .replace(/\\n/g, ' ')                        
    .replace(/\n/g, ' ')                         
    .trim();                                     
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting request processing');
    const requestBody = await req.json();
    console.log('Received request body:', requestBody);

    const { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises } = requestBody;
    console.log('Parsed parameters:', { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises });

    // Validate required fields
    if (!fitnessLevel) {
      console.error('Missing fitness level');
      return new Response(
        JSON.stringify({ error: 'Please select your fitness level' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    if (!numberOfDays || numberOfDays < 1) {
      console.error('Invalid number of days:', numberOfDays);
      return new Response(
        JSON.stringify({ error: 'Please select number of days' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('Missing Gemini API key');
      throw new Error('Missing Gemini API key');
    }

    console.log('Initializing Gemini with API key');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    // Construct prompt from user inputs
    const prompt = `As an expert fitness coach, create a ${numberOfDays}-day workout program. 
      ${weatherPrompt ? `Consider these weather conditions: ${weatherPrompt}` : ''}
      ${selectedExercises?.length ? `Include these exercises: ${selectedExercises.map(e => e.name).join(", ")}` : ''}
      ${fitnessLevel ? `This program is for a ${fitnessLevel} level individual` : ''}
      ${prescribedExercises ? `Include these prescribed exercises/modifications: ${prescribedExercises}` : ''}

      For each day, provide:
      1. A brief description of the focus and stimulus
      2. A warmup routine
      3. The main workout
      4. A strength component
      5. Optional notes or modifications

      Format each day as follows:
      {
        "day1": {
          "description": "...",
          "warmup": "...",
          "workout": "...",
          "strength": "...",
          "notes": "..."
        }
      }

      Ensure the response is a valid JSON object.`;

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    console.log('Received response from Gemini:', result);

    if (!result || !result.response) {
      console.error('Failed to generate response from Gemini');
      throw new Error('Failed to generate response from Gemini');
    }

    const response = result.response;
    const text = response.text();
    
    console.log('Raw text from Gemini:', text);

    try {
      const cleanedText = cleanJsonText(text);
      console.log('Cleaned response:', cleanedText);
      
      let workouts;
      try {
        workouts = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Initial JSON parse failed, attempting to fix common issues:', parseError);
        // Try to fix common JSON issues
        const fixedText = cleanedText
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/\\/g, '\\\\'); // Escape backslashes
        console.log('Fixed text:', fixedText);
        workouts = JSON.parse(fixedText);
      }

      console.log('Parsed workouts:', workouts);

      // Validate the structure of each day's workout
      const requiredFields = ['description', 'warmup', 'workout', 'strength', 'notes'];
      Object.entries(workouts).forEach(([day, workout]: [string, any]) => {
        const missingFields = requiredFields.filter(field => 
          !workout[field] || typeof workout[field] !== 'string' || !workout[field].trim()
        );

        if (missingFields.length > 0) {
          throw new Error(`Day ${day} is missing or has invalid required fields: ${missingFields.join(', ')}`);
        }
      });

      return new Response(
        JSON.stringify(workouts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate workout plan', details: error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-weekly-workouts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});