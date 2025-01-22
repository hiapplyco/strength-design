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
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();

    if (!numberOfDays || numberOfDays < 1) {
      throw new Error('Invalid number of days');
    }

    const schema = {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    };

    for (let i = 1; i <= numberOfDays; i++) {
      const dayKey = `day${i}`;
      schema.properties[dayKey] = {
        type: SchemaType.OBJECT,
        properties: {
          description: { type: SchemaType.STRING },
          warmup: { type: SchemaType.STRING },
          workout: { type: SchemaType.STRING },
          strength: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ["description", "warmup", "workout", "strength"]
      };
      schema.required.push(dayKey);
    }

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

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: createWorkoutGenerationPrompt({
            numberOfDays,
            weatherPrompt,
            selectedExercises,
            fitnessLevel,
            prescribedExercises
          }) 
        }] 
      }],
    });

    if (!result?.response) {
      throw new Error('Failed to generate response from Gemini');
    }

    const workouts = JSON.parse(result.response.text());

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});