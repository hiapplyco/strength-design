
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, currentConfig, conversationHistory } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- Enhanced SYSTEM PROMPT to explicitly extract fitness goals for prescribedExercises ---
    const systemPrompt = `You are an expert fitness coach and workout configuration assistant. Your job is to help users create personalized workout programs through conversation.

CURRENT CONFIGURATION:
- Fitness Level: ${currentConfig.fitnessLevel || 'Not set'}
- Goals: ${currentConfig.prescribedExercises || currentConfig.goals || 'Not set'}
- Equipment: ${currentConfig.selectedExercises?.map(e => e.name).join(', ') || 'Not set'}
- Injuries/Limitations: ${currentConfig.injuries || 'Not set'}
- Schedule: ${currentConfig.numberOfCycles} cycle(s) of ${currentConfig.numberOfDays} days
- Weather Integration: ${currentConfig.weatherData ? 'Enabled' : 'Not set'}

CONVERSATION CONTEXT:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

RESPONSE FORMAT:
You must respond with a JSON object containing:
{
  "message": "Your conversational response to the user",
  "configUpdates": {
    // Only include fields that should be updated based on the conversation
    // Available fields: fitnessLevel, prescribedExercises, injuries, numberOfDays, numberOfCycles, selectedExercises
    // If the user mentions their main goals, always propagate to 'prescribedExercises'
    // If you extract goals as a list or array, join them as a comma-separated string for 'prescribedExercises'
  },
  "suggestions": {
    "nextQuestions": ["What should I ask next?"],
    "missingFields": ["Field names that still need to be filled"]
  }
}

GUIDELINES:
1. Whenever the user mentions their fitness or training goals, always set/update the 'prescribedExercises' field.
2. If you extract goals in an array, join as a comma-separated string and set as prescribedExercises.
3. Be conversational and encouraging, ask one focused question at a time.
4. Provide helpful suggestions and guidance, use specific fitness terminology.
5. If the user uploads a file, summarize and extract any exercise programs or notes as configuration updates.
6. Always use the config fields exactly as described above (do not invent keys).

USER MESSAGE: ${message}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Try to parse JSON from the response
    let parsedResponse;
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      parsedResponse = {
        message: responseText,
        configUpdates: {},
        suggestions: {
          nextQuestions: [],
          missingFields: []
        }
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in workout-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm having trouble processing that right now. Could you try rephrasing your request?",
      configUpdates: {},
      suggestions: { nextQuestions: [], missingFields: [] }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
