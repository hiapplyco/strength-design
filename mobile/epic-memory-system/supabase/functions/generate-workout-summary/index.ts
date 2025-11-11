
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flashflash" });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workouts } = await req.json();
    console.log('Generating summary for workouts:', Object.keys(workouts).length);

    if (!workouts) {
      throw new Error('No workout data provided');
    }

    // Create a simple text representation of the workout for Gemini to summarize
    let workoutText = "Workout Program:\n\n";
    
    Object.entries(workouts).forEach(([day, data]: [string, any]) => {
      if (day === '_meta') return; // Skip metadata
      
      workoutText += `${day.toUpperCase()}:\n`;
      if (data.description) workoutText += `Focus: ${data.description}\n`;
      if (data.warmup) workoutText += `Warmup: ${data.warmup}\n`;
      if (data.strength) workoutText += `Strength: ${data.strength}\n`;
      if (data.workout) workoutText += `Workout: ${data.workout}\n`;
      if (data.notes) workoutText += `Notes: ${data.notes}\n`;
      workoutText += "\n";
    });

    const prompt = `
      You are a professional fitness coach analyzing a workout program.
      
      Provide a concise 2-3 sentence summary of this workout program highlighting:
      1. The main focus/type of training (strength, hypertrophy, endurance, etc.)
      2. Primary body parts or movement patterns emphasized
      3. Overall intensity and suitability level
      
      Be specific and professional. Mention specific exercises or training methods if they're prominent.
      
      IMPORTANT: Keep your response under 200 characters and make it engaging.
      
      Here's the workout program to analyze:
      ${workoutText}
    `;

    console.log('Sending prompt to Gemini');
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    });

    const response = result.response;
    const summaryText = response.text().trim();
    
    console.log('Generated summary:', summaryText);

    return new Response(
      JSON.stringify({ summary: summaryText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating workout summary:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate workout summary',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
