import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../shared/cors.ts";

interface ProgramSearchRequest {
  query: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
  rest?: string;
  notes?: string;
}

interface Workout {
  name: string;
  day?: string;
  exercises: Exercise[];
}

interface ProgramPhase {
  name: string;
  duration: string;
  workouts: Workout[];
}

interface FitnessProgram {
  programName: string;
  description: string;
  level: string;
  goals: string[];
  duration: string;
  frequency: string;
  equipment: string[];
  phases: ProgramPhase[];
  progressionScheme?: string;
  notes?: string[];
}

serve(async (req) => {
  console.log("Program search function invoked");

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  try {
    const { query }: ProgramSearchRequest = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    console.log('Searching for program:', query);

    // Create a detailed prompt for Perplexity to extract program information
    const systemPrompt = `You are a fitness program analyzer. Extract detailed information about fitness programs and return it in a structured JSON format.

When analyzing a fitness program, include:
1. Program name and description
2. Training level (beginner, intermediate, advanced)
3. Primary goals (strength, muscle, endurance, etc.)
4. Total duration and weekly frequency
5. Required equipment
6. All phases/blocks with their workouts
7. Progression scheme
8. Important notes or tips

Format the response as valid JSON matching this structure:
{
  "programName": "string",
  "description": "string",
  "level": "string",
  "goals": ["string"],
  "duration": "string",
  "frequency": "string",
  "equipment": ["string"],
  "phases": [
    {
      "name": "string",
      "duration": "string",
      "workouts": [
        {
          "name": "string",
          "day": "string",
          "exercises": [
            {
              "name": "string",
              "sets": number,
              "reps": "number or string",
              "rest": "string",
              "notes": "string"
            }
          ]
        }
      ]
    }
  ],
  "progressionScheme": "string",
  "notes": ["string"]
}`;

    const userPrompt = `Find detailed information about the "${query}" fitness program. Include all workout details, exercises, sets, reps, and progression schemes. If this is a well-known program like Starting Strength, 5/3/1, StrongLifts, etc., provide the official program structure.`;

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      })
    });

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.text();
      console.error('Perplexity API error:', errorData);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const content = perplexityData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Perplexity API');
    }

    // Try to extract JSON from the response
    let programData: FitnessProgram;
    try {
      // Look for JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        programData = JSON.parse(jsonString);
      } else {
        throw new Error('Could not find JSON in response');
      }
    } catch (parseError) {
      console.error('Failed to parse program data:', parseError);
      
      // Fallback: return a basic structure with the raw content
      programData = {
        programName: query,
        description: `Information about ${query} program`,
        level: "intermediate",
        goals: ["strength", "muscle"],
        duration: "12 weeks",
        frequency: "3-4 days/week",
        equipment: ["barbell", "dumbbells"],
        phases: [{
          name: "Main Phase",
          duration: "12 weeks",
          workouts: [{
            name: "Workout A",
            exercises: []
          }]
        }],
        notes: [content]
      };
    }

    // Validate and clean the data
    if (!programData.programName) {
      programData.programName = query;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: programData,
        sources: perplexityData.citations || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in program-search:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});