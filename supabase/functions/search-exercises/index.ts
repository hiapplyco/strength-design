
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Received search query:', query);

    // Initialize Gemini
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

    // Create Gemini prompt for search analysis
    const searchPrompt = `
      You are an expert fitness trainer helping to search through exercise data.
      Search Query: "${query}"
      
      Analyze this search query and provide:
      1. Key terms and synonyms to look for
      2. Relevant muscle groups
      3. Difficulty level (if mentioned)
      4. Equipment requirements (if mentioned)
      5. Exercise type preferences (if mentioned)
      
      Format your response as JSON with these fields.
    `;

    const result = await model.generateContent(searchPrompt);
    const analysis = JSON.parse(result.response.text());
    console.log('Search analysis:', analysis);

    // Use Gemini to find the most relevant exercises
    const exerciseSelectionPrompt = `
      Given these search parameters:
      ${JSON.stringify(analysis, null, 2)}
      
      Select the most relevant exercises from this list. Consider:
      - Matching muscle groups
      - Appropriate difficulty level
      - Required equipment availability
      - Exercise type preferences
      
      For each exercise, explain why it matches the search criteria.
      Return your response as JSON with 'matches' array containing objects with 'exercise' and 'relevance_score' (0-100).
    `;

    const exerciseResult = await model.generateContent(exerciseSelectionPrompt);
    const exerciseMatches = JSON.parse(exerciseResult.response.text());
    console.log('Exercise matches:', exerciseMatches);

    // Sort and filter the exercises based on Gemini's analysis
    const results = exerciseMatches.matches
      .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
      .slice(0, 10) // Limit to top 10 matches
      .map((match: any) => {
        const exercise = exercises.find((e: any) => e.name === match.exercise);
        if (exercise) {
          return {
            ...exercise,
            relevance_score: match.relevance_score,
          };
        }
        return null;
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({ 
        results,
        analysis 
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    );

  } catch (error) {
    console.error('Error in search-exercises function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    );
  }
});
