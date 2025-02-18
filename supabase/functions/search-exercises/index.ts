
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanAndParseJSON = (text: string) => {
  // Remove any markdown formatting or backticks
  let cleaned = text.replace(/```json\n|\n```|```/g, '');
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse error:', e);
    console.log('Attempted to parse:', cleaned);
    throw new Error('Failed to parse Gemini response');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Received search query:', query);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Fetch exercises data
    const exercisesResponse = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
    if (!exercisesResponse.ok) {
      throw new Error('Failed to fetch exercises');
    }
    const exercises = await exercisesResponse.json();

    // Updated prompt to emphasize JSON format
    const searchPrompt = `Analyze this fitness search query: "${query}"
    Return a JSON object with these fields (no markdown, no backticks):
    {
      "muscle_groups": [], // array of target muscle groups
      "difficulty_level": "", // beginner, intermediate, or advanced
      "equipment": "", // required equipment if mentioned
      "exercise_type": "" // type of exercise if specified
    }`;

    const result = await model.generateContent(searchPrompt);
    const resultText = result.response.text();
    console.log('Raw Gemini response:', resultText);
    
    const analysis = cleanAndParseJSON(resultText);
    console.log('Parsed analysis:', analysis);

    // Simplified exercise matching prompt
    const exerciseSelectionPrompt = `Given this search criteria: ${JSON.stringify(analysis)}
    Return a JSON object with this format (no markdown, no backticks):
    {
      "matches": [
        {
          "exercise": "exercise name exactly as in database",
          "relevance_score": number between 0-100
        }
      ]
    }`;

    const exerciseResult = await model.generateContent(exerciseSelectionPrompt);
    const exerciseResultText = exerciseResult.response.text();
    console.log('Raw exercise matches response:', exerciseResultText);
    
    const exerciseMatches = cleanAndParseJSON(exerciseResultText);
    console.log('Parsed exercise matches:', exerciseMatches);

    if (!Array.isArray(exerciseMatches.matches)) {
      throw new Error('Invalid exercise matches format');
    }

    // Filter and format results
    const results = exerciseMatches.matches
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10)
      .map(match => {
        const exercise = exercises.find(e => 
          e.name.toLowerCase() === match.exercise.toLowerCase()
        );
        return exercise ? { ...exercise, relevance_score: match.relevance_score } : null;
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({ results, analysis }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in search-exercises function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
