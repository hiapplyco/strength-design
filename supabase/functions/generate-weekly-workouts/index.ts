import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 2;
const TIMEOUT_MS = 20000; // 20 seconds timeout

const generateWithGemini = async (prompt: string, retryCount = 0): Promise<string> => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  console.log(`Attempt ${retryCount + 1} - Starting Gemini generation with prompt length: ${prompt.length}`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192, // Set to 8192 as requested
    },
  });

  try {
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API timeout')), TIMEOUT_MS)
      ),
    ]);

    if (result instanceof Error) throw result;
    console.log('Successfully received Gemini response');
    return result.response.text();
  } catch (error) {
    console.error(`Error in generateWithGemini (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      return generateWithGemini(prompt, retryCount + 1);
    }
    
    throw new Error(`Gemini API error after ${retryCount + 1} attempts: ${error.message}`);
  }
};

// Simplified prompt to reduce token count while maintaining quality
const createExpertCoachPrompt = (expertise: string) => `
Create a focused weekly workout plan based on: ${expertise}. Include for each day:

1. Brief description (2-3 sentences max)
2. Quick warmup sequence
3. Main workout with clear standards
4. Basic strength focus
5. Short coaching notes

Format as JSON:
{
  "Sunday": {
    "description": "Focus and purpose",
    "warmup": "Warmup protocol",
    "workout": "Main workout",
    "notes": "Coaching notes",
    "strength": "Strength focus"
  },
  // ... repeat for all days
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { prompt } = await req.json();
    console.log('Processing request for expertise:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt');
    }

    const expertPrompt = createExpertCoachPrompt(prompt);
    console.log('Generated expert prompt length:', expertPrompt.length);
    
    const textResponse = await generateWithGemini(expertPrompt);
    console.log('Received response from Gemini');

    try {
      const cleanedText = textResponse.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned response length:', cleanedText.length);
      
      const workouts = JSON.parse(cleanedText);

      // Validate required structure
      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'warmup', 'workout', 'notes', 'strength'];

      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        console.error('Invalid workout structure');
        throw new Error('Generated workout plan is incomplete');
      }

      console.log('Successfully validated workout structure');
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Failed to generate valid workout plan');
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate workouts'
      }), {
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});