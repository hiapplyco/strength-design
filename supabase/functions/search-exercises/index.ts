
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

    const result = await model.generateContent([
      {
        role: "user",
        parts: [{
          text: `Analyze this fitness search query: "${query}"
          
          Return a JSON object that follows this EXACT format, with no additional text or formatting:
          {
            "muscle_groups": ["list", "of", "muscles"],
            "difficulty_level": "beginner/intermediate/advanced",
            "equipment": "required equipment",
            "exercise_type": "type of exercise"
          }`
        }]
      }
    ]);

    console.log('Raw Gemini response:', result.response.text());
    
    let analysis;
    try {
      const cleanText = result.response.text().trim();
      analysis = JSON.parse(cleanText);
      console.log('Parsed analysis:', analysis);
    } catch (e) {
      console.error('Failed to parse analysis:', e);
      throw new Error(`Invalid analysis response: ${e.message}`);
    }

    // Get exercise matches
    const exerciseResult = await model.generateContent([
      {
        role: "user",
        parts: [{
          text: `Given these search criteria: ${JSON.stringify(analysis)}
          
          Return ONLY a JSON object in this EXACT format, with no additional text:
          {
            "matches": [
              {
                "exercise": "exact exercise name from database",
                "relevance_score": 95
              }
            ]
          }`
        }]
      }
    ]);

    console.log('Raw exercise matches:', exerciseResult.response.text());
    
    let exerciseMatches;
    try {
      const cleanExerciseText = exerciseResult.response.text().trim();
      exerciseMatches = JSON.parse(cleanExerciseText);
      console.log('Parsed matches:', exerciseMatches);
    } catch (e) {
      console.error('Failed to parse exercise matches:', e);
      throw new Error(`Invalid exercise matches response: ${e.message}`);
    }

    if (!exerciseMatches?.matches || !Array.isArray(exerciseMatches.matches)) {
      throw new Error('Invalid exercise matches format - expected array');
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
      JSON.stringify({ 
        results, 
        analysis,
        debug: {
          query,
          analysisResponse: result.response.text(),
          matchesResponse: exerciseResult.response.text()
        }
      }),
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
