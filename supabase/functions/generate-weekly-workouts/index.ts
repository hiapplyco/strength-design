import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.1.3";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
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
  try {
    console.log('Initializing Gemini with prompt:', prompt);
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
    console.log('Received response from Gemini');
    return result.response.text();
  } catch (error) {
    console.error('Error in generateWithSchema:', error);
    throw error;
  }
};

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    Sunday: {
      type: SchemaType.OBJECT,
      properties: {
        description: { type: SchemaType.STRING },
        warmup: { type: SchemaType.STRING },
        wod: { type: SchemaType.STRING },
        notes: { type: SchemaType.STRING }
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt in request body');
    }

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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing or validating JSON:', parseError);
      console.log('Failed to parse text:', textResponse);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format in AI response',
          details: parseError.message,
          rawResponse: textResponse.substring(0, 200) + '...'
        }), {
          status: 500,
          headers: corsHeaders,
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
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: corsHeaders,
      }
    );
  }
});