
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch exercises from the source
    const response = await fetch('https://raw.githubusercontent.com/exercemus/exercises/minified/minified-exercises.json');
    if (!response.ok) {
      throw new Error('Failed to fetch exercises data');
    }

    const exercises = await response.json();
    console.log(`Fetched ${exercises.length} exercises`);

    // Clear existing exercises
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      throw new Error(`Failed to clear existing exercises: ${deleteError.message}`);
    }

    // Insert new exercises in batches
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize).map(exercise => ({
        name: exercise.name,
        force: exercise.force,
        level: exercise.level,
        mechanic: exercise.mechanic,
        equipment: exercise.equipment,
        primary_muscles: exercise.primaryMuscles,
        secondary_muscles: exercise.secondaryMuscles,
        instructions: exercise.instructions,
        category: exercise.category
      }));

      batches.push(
        supabase
          .from('exercises')
          .insert(batch)
          .select()
      );
    }

    const results = await Promise.all(batches);
    const errors = results.filter(result => result.error).map(result => result.error);

    if (errors.length > 0) {
      throw new Error(`Some batches failed to insert: ${JSON.stringify(errors)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully imported ${exercises.length} exercises`
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in import-exercises function:', error);
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
