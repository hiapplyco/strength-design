import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiGenerationConfig {
  model: string;
  schema?: any;
  apiKey: string;
}

const generateWithSchema = async (
  { model: modelName, schema, apiKey }: GeminiGenerationConfig,
  prompt: string
) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    Sunday: {
      type: SchemaType.OBJECT,
      properties: {
        description: { type: SchemaType.STRING, description: "Brief overview of the workout" },
        warmup: { type: SchemaType.STRING, description: "Detailed warmup routine" },
        wod: { type: SchemaType.STRING, description: "Main workout of the day" },
        notes: { type: SchemaType.STRING, description: "Additional coaching notes" }
      },
      required: ["description", "warmup", "wod", "notes"]
    },
    Monday: { type: SchemaType.OBJECT, ref: "#/properties/Sunday" },
    Tuesday: { type: SchemaType.OBJECT, ref: "#/properties/Sunday" },
    Wednesday: { type: SchemaType.OBJECT, ref: "#/properties/Sunday" },
    Thursday: { type: SchemaType.OBJECT, ref: "#/properties/Sunday" },
    Friday: { type: SchemaType.OBJECT, ref: "#/properties/Sunday" },
    Saturday: { type: SchemaType.OBJECT, ref: "#/properties/Sunday" }
  },
  required: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    const systemPrompt = `You are a CrossFit coach creating a week of workouts. Create a complete weekly program that includes a brief description, warmup, workout (WOD), and coaching notes for each day. Consider progression, recovery, and variety in the programming.

Additional context from coach: ${prompt || 'Create a balanced week of workouts'}

Important: Return the response as a properly formatted JSON object with all required fields.`;

    const textResponse = await generateWithSchema(
      {
        apiKey: Deno.env.get('GEMINI_API_KEY') || '',
        model: "gemini-pro",
        schema: schema
      },
      systemPrompt
    );

    console.log('Raw response from Gemini:', textResponse);

    try {
      // Clean the response text
      const cleanedText = textResponse
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\\n/g, ' ')
        .replace(/\n/g, ' ');

      console.log('Cleaned text:', cleanedText);

      // Parse the JSON
      const workouts = JSON.parse(cleanedText);

      // Validate the structure
      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'warmup', 'wod', 'notes'];

      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        throw new Error('Generated JSON is missing required days or fields');
      }

      console.log('Successfully validated workouts:', workouts);
      
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing or validating JSON:', parseError);
      console.log('Failed to parse text:', textResponse);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format',
          details: parseError.message,
          rawResponse: textResponse.substring(0, 200) + '...'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate or parse workouts'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});