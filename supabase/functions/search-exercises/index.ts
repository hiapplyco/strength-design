
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  console.log("Search exercises function invoked");

  // Handle CORS preflight
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

    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search exercises in the database
    const { data: results, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,primary_muscles.cs.{${query}},equipment.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Database search error:', error);
      throw error;
    }

    console.log('Found results:', results?.length);

    // Map the results to include preview information
    const formattedResults = results?.map(exercise => ({
      name: exercise.name,
      type: exercise.category,
      muscle: exercise.primary_muscles?.[0],
      equipment: exercise.equipment,
      difficulty: exercise.level,
      instructions: exercise.instructions,
      // Add more fields as needed from your exercise table
    })) || [];

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
