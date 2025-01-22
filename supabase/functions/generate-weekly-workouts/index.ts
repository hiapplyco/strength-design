import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt } from "../shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting generate-weekly-workouts function');
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('Missing Gemini API key');
      throw new Error('Missing Gemini API key');
    }
    console.log('Gemini API key found');

    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();
    console.log('Request params:', { weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays });

    if (!numberOfDays || numberOfDays < 1) {
      throw new Error('Invalid number of days');
    }

    // Create dynamic schema based on number of days
    const schema = {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    };

    // Dynamically add properties for each day
    for (let i = 1; i <= numberOfDays; i++) {
      const dayKey = `day${i}`;
      schema.properties[dayKey] = {
        type: SchemaType.OBJECT,
        properties: {
          description: {
            type: SchemaType.STRING,
            description: "Brief description of the workout focus",
            nullable: false,
          },
          warmup: {
            type: SchemaType.STRING,
            description: "Detailed warmup routine",
            nullable: false,
          },
          workout: {
            type: SchemaType.STRING,
            description: "Main workout details",
            nullable: false,
          },
          strength: {
            type: SchemaType.STRING,
            description: "Strength component details",
            nullable: false,
          },
          notes: {
            type: SchemaType.STRING,
            description: "Additional coaching notes",
            nullable: true,
          },
        },
        required: ["description", "warmup", "workout", "strength"],
      };
      schema.required.push(dayKey);
    }

    console.log('Initializing Gemini AI with schema');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    console.log('Sending request to Gemini with prompt');
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: createWorkoutGenerationPrompt({
        numberOfDays,
        weatherPrompt,
        selectedExercises,
        fitnessLevel,
        prescribedExercises
      }) }] }],
    });

    if (!result || !result.response) {
      console.error('No response from Gemini');
      throw new Error('Failed to generate response from Gemini');
    }

    console.log('Parsing Gemini response');
    const workouts = JSON.parse(result.response.text());
    console.log('Successfully generated workouts:', workouts);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: error.stack,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});