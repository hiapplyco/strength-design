import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch exercises from GitHub
async function fetchExercises() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
}

// Function to get full image URL
function getFullImageUrl(imagePath: string) {
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
}

// Function to filter exercises based on fitness level
function filterExercisesByLevel(exercises: any[], level: string) {
  const levelMap: Record<string, string[]> = {
    'beginner': ['beginner'],
    'intermediate': ['beginner', 'intermediate'],
    'advanced': ['beginner', 'intermediate', 'expert']
  };

  const allowedLevels = levelMap[level.toLowerCase()] || ['beginner'];
  return exercises.filter(ex => allowedLevels.includes(ex.level)).slice(0, 30);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Function called');
    
    const {
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    } = await req.json()

    console.log('Received params:', { weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays });

    // Fetch and process exercises
    const exercises = await fetchExercises();
    console.log(`Fetched ${exercises.length} exercises`);

    const filteredExercises = filterExercisesByLevel(exercises, fitnessLevel);
    console.log(`Filtered to ${filteredExercises.length} exercises for level ${fitnessLevel}`);

    // Create an exercise map for easy lookup
    const exerciseMap = new Map(
      filteredExercises.map(ex => [
        ex.name.toLowerCase(),
        ex.images.map(img => getFullImageUrl(img))
      ])
    );

    const processedExercises = filteredExercises.map(ex => ({
      name: ex.name,
      equipment: ex.equipment,
      primaryMuscles: ex.primaryMuscles,
      level: ex.level,
      images: ex.images.map(img => getFullImageUrl(img))
    }));

    // Prepare Gemini request
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
    
    const userPrompt = `
    Create a ${numberOfDays}-day workout program for a ${fitnessLevel} level athlete.
    Weather conditions: ${weatherPrompt}
    Prescribed exercises: ${prescribedExercises}
    Additional requirements: ${prompt}

    Use these exercises (choose appropriate ones for each day):
    ${JSON.stringify(processedExercises.map(ex => ({
      name: ex.name,
      equipment: ex.equipment,
      level: ex.level
    })), null, 2)}

    Format the response as a JSON object like this:
    {
      "day1": {
        "description": "Focus of the day",
        "warmup": "Detailed warmup routine",
        "workout": "Main workout content",
        "strength": "Strength focus",
        "notes": "Additional coaching notes",
        "images": []
      }
    }

    IMPORTANT: For each exercise you mention in the workout, you MUST use its exact name as provided in the exercise list above.
    `;

    console.log('Sending request to Gemini...');

    const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: userPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received Gemini API response');

    let workoutPlan = data.candidates[0].content.parts[0].text;
    workoutPlan = workoutPlan.replace(/```json\s*|\s*```/g, '').trim();
    
    let parsedWorkoutPlan = JSON.parse(workoutPlan);
    
    // Process the workout plan to add images
    for (const day in parsedWorkoutPlan) {
      const dayPlan = parsedWorkoutPlan[day];
      const images = new Set<string>();
      
      // Helper function to extract exercise names and find their images
      const findExerciseImages = (text: string) => {
        if (!text) return;
        
        processedExercises.forEach(ex => {
          if (text.toLowerCase().includes(ex.name.toLowerCase())) {
            ex.images.forEach(img => images.add(img));
          }
        });
      };

      // Search for exercises in all sections
      findExerciseImages(dayPlan.workout);
      findExerciseImages(dayPlan.warmup);
      findExerciseImages(dayPlan.strength);

      // Update the day plan with found images
      parsedWorkoutPlan[day].images = Array.from(images);
      
      console.log(`Day ${day} images:`, parsedWorkoutPlan[day].images);
    }

    // Save to generated_workouts table if we have a valid session
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('generated_workouts')
          .insert({
            user_id: session.user.id,
            workout_data: parsedWorkoutPlan,
            title: `${numberOfDays}-Day Workout Plan`,
            tags: [fitnessLevel],
            summary: `${numberOfDays}-day workout plan`
          });
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      // Continue even if save fails
    }

    return new Response(JSON.stringify(parsedWorkoutPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
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
