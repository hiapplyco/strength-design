
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Exercise {
  id: string;
  name: string;
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

serve(async (req) => {
  console.log("Search exercises function invoked");

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log('Searching for:', query);

    // Fetch exercises from the GitHub repo
    const response = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }

    const exercises: Exercise[] = await response.json();
    
    // Search implementation
    const results = exercises.filter(exercise => {
      const searchTerms = [
        exercise.name,
        exercise.category,
        ...exercise.primaryMuscles,
        ...exercise.secondaryMuscles,
        exercise.equipment,
        exercise.level
      ].map(term => term?.toLowerCase());

      return searchTerms.some(term => term?.includes(query.toLowerCase()));
    });

    console.log('Found results:', results.length);

    // Format results with proper image URLs
    const formattedResults = results.map(exercise => ({
      name: exercise.name,
      type: exercise.category,
      muscle: exercise.primaryMuscles[0],
      equipment: exercise.equipment,
      difficulty: exercise.level,
      mechanic: exercise.mechanic,
      force: exercise.force,
      instructions: exercise.instructions,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      images: exercise.images.map(image => 
        `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/${image}`
      )
    }));

    return new Response(
      JSON.stringify({
        results: formattedResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in search-exercises:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
