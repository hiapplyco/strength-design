import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { workoutPlan } = await req.json()
    
    if (!workoutPlan) {
      throw new Error('Workout plan is required')
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
    You are a fitness influencer creating a video script for a workout plan. 
    Convert this workout plan into a directorial script that includes both what to say and how to present it.
    
    IMPORTANT FORMATTING REQUIREMENTS:
    - Use LOTS of line breaks between sections for easy reading
    - Start each section with [CAMERA SETUP] to describe how to position for recording
    - Follow with [SCRIPT] for what to say
    - Use 4 line breaks between major sections
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

    const result = await model.generateContent(prompt);
    const monologue = result.response.text();

    console.log('Generated monologue:', monologue);

    return new Response(
      JSON.stringify({ monologue }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})