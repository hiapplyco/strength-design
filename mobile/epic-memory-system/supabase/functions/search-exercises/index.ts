
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.js";

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

    const response = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }

    const exercises: Exercise[] = await response.json();
    
    // Improved search logic - more flexible matching
    const searchTerm = query.toLowerCase().trim();
    
    const results = exercises.filter(exercise => {
      // Create an array of all searchable text
      const searchableFields = [
        exercise.name?.toLowerCase() || '',
        exercise.category?.toLowerCase() || '',
        exercise.equipment?.toLowerCase() || '',
        exercise.level?.toLowerCase() || '',
        exercise.force?.toLowerCase() || '',
        exercise.mechanic?.toLowerCase() || '',
        ...(exercise.primaryMuscles?.map(m => m.toLowerCase()) || []),
        ...(exercise.secondaryMuscles?.map(m => m.toLowerCase()) || [])
      ];

      // Check if any field contains the search term
      return searchableFields.some(field => 
        field && field.includes(searchTerm)
      );
    });

    // Limit results to first 20 for performance
    const limitedResults = results.slice(0, 20);

    console.log('Found results:', limitedResults.length);

    const formattedResults = limitedResults.map((exercise, index) => ({
      id: exercise.id || `exercise-${index}`, // Ensure each exercise has an ID
      name: exercise.name,
      level: exercise.level,
      type: exercise.category,
      muscle: exercise.primaryMuscles?.[0] || 'Unknown',
      equipment: exercise.equipment,
      difficulty: exercise.level,
      mechanic: exercise.mechanic,
      force: exercise.force,
      instructions: exercise.instructions || [],
      primaryMuscles: exercise.primaryMuscles || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
      images: exercise.images?.map(image => 
        `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${image}`
      ) || []
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
