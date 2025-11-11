import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// Configuration constants
const GEMINI_MODEL = "gemini-2.5-pro";
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a standardized JSON response
 * @param data - The data to send in the response
 * @param status - HTTP status code (default: 200)
 * @returns Response object
 */
function createJsonResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Generates a workout script using Gemini AI
 * @param workoutPlan - The workout plan to convert into a script
 * @param apiKey - The Gemini API key
 * @returns The generated script
 */
async function generateWorkoutScript(workoutPlan: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  
  // Initial prompt to generate the directorial script
  const initialPrompt = `
  You are a fitness influencer creating a video script for a workout plan. 
  Convert this workout plan into a directorial script that includes both what to say and how to present it.
  
  IMPORTANT FORMATTING REQUIREMENTS:
  - Use multiple newline characters (\\n\\n\\n\\n) between major sections for clear visual breaks
  - Start each section with [CAMERA SETUP] followed by camera positioning details
  - Follow with [SCRIPT] for the actual lines to say
  - Keep sentences short and easy to read
  - Add emojis for visual engagement
  - Include clear verbal transitions between sections
  
  FORMAT EXAMPLE:
  [CAMERA SETUP]
  Position camera at medium shot, showing full upper body
  Stand slightly to the left to demonstrate exercises
  [SCRIPT]
  Hey fitness family! Today we're crushing an amazing full-body workout!
  [CAMERA SETUP]
  Switch to wide shot to show full body movement
  Face slightly right to demonstrate proper form
  [SCRIPT]
  Let's start with our warm-up...
  Here's the workout plan to convert:
  ${workoutPlan}
  
  Remember to:
  1. Start with an energetic introduction
  2. Break down the content into clear sections
  3. End with a motivational closing
  4. Include camera positioning for each section
  5. Add form cues and safety reminders
  `;
  
  // Generate the initial script with camera directions
  const initialResult = await model.generateContent(initialPrompt);
  const fullScript = initialResult.response.text();
  
  // Second prompt to clean the script and extract only the speaking parts
  const cleansingPrompt = `
  Below is a workout video script that contains both camera directions and speaking parts.
  Extract ONLY the speaking parts (the text under [SCRIPT] sections) and format them as a 
  clean, readable script that a fitness influencer can read from a teleprompter.
  
  1. Remove all [CAMERA SETUP] sections and their content
  2. Remove the [SCRIPT] tags themselves
  3. Maintain paragraph breaks between sections for readability
  4. Keep all emojis and expressions
  5. Format as plain text only - no markup
  
  Original script:
  ${fullScript}
  
  Clean teleprompter-ready script:
  `;
  
  // Clean the script to extract only speaking parts
  const cleansingResult = await model.generateContent(cleansingPrompt);
  return cleansingResult.response.text();
}

/**
 * Main request handler
 * @param req - The incoming request
 * @returns Response with generated content or error
 */
async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  
  try {
    // Extract and validate the workout plan
    const { workoutPlan } = await req.json();
    
    if (!workoutPlan?.trim()) {
      return createJsonResponse({ error: 'Workout plan is required' }, 400);
    }
    
    // Get API key from environment
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return createJsonResponse({ error: 'Gemini API key not configured' }, 500);
    }
    
    // Generate the workout script
    console.log('Generating workout script from plan...');
    const monologue = await generateWorkoutScript(workoutPlan, apiKey);
    console.log('Script generation complete');
    
    return createJsonResponse({ monologue });
    
  } catch (error) {
    console.error('Error generating workout script:', error);
    return createJsonResponse({ 
      error: error.message || 'An unknown error occurred'
    }, 500);
  }
}

// Start the server
serve(handleRequest);
