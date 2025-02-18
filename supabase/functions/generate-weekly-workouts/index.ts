
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { generateSystemPrompt, generateUserPrompt } from "./prompts.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch exercises from GitHub
async function fetchExercises() {
  const response = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
  }
  return await response.json();
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
  return exercises.filter(ex => allowedLevels.includes(ex.level));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    } = await req.json()

    console.log('Received request with params:', {
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    });

    // Fetch exercises from GitHub
    const exercises = await fetchExercises();
    console.log(`Fetched ${exercises.length} exercises from GitHub`);

    // Filter exercises based on fitness level and limit the number
    const filteredExercises = filterExercisesByLevel(exercises, fitnessLevel)
      .slice(0, 50); // Limit to 50 exercises to avoid token limit

    // Process exercises to include full image URLs
    const processedExercises = filteredExercises.map(ex => ({
      name: ex.name,
      equipment: ex.equipment,
      primaryMuscles: ex.primaryMuscles,
      level: ex.level,
      images: ex.images.map(img => getFullImageUrl(img))
    }));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable')
    }

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

    console.log('Preparing Gemini request...');

    const prompt = `
    As a professional fitness trainer, create a ${numberOfDays}-day workout program.
    
    Available exercises:
    ${JSON.stringify(processedExercises.map(ex => ({
      name: ex.name,
      equipment: ex.equipment,
      level: ex.level,
      images: ex.images
    })), null, 2)}

    Requirements:
    - Fitness Level: ${fitnessLevel}
    - Weather Conditions: ${weatherPrompt}
    - Prescribed Exercises: ${prescribedExercises}
    
    Return a JSON object with ${numberOfDays} workout days, each containing:
    {
      "day1": {
        "description": "Focus of the day",
        "warmup": "Detailed warmup routine",
        "workout": "Main workout content",
        "strength": "Strength focus",
        "notes": "Additional coaching notes",
        "images": ["Image URLs from exercises used"]
      }
    }

    IMPORTANT: Include relevant exercise images in the 'images' array for each day.
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
          parts: [{ text: prompt }]
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
    
    const parsedWorkoutPlan = JSON.parse(workoutPlan);
    
    const daysInPlan = Object.keys(parsedWorkoutPlan).length;
    if (daysInPlan !== numberOfDays) {
      throw new Error(`Generated plan has ${daysInPlan} days but ${numberOfDays} were requested`);
    }

    // Save to generated_workouts table
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error: saveError } = await supabase
        .from('generated_workouts')
        .insert({
          user_id: session.user.id,
          workout_data: parsedWorkoutPlan,
          title: `${numberOfDays}-Day Workout Plan`,
          tags: [fitnessLevel],
          summary: `${numberOfDays}-day workout plan`
        });

      if (saveError) {
        console.error('Error saving workout:', saveError);
      }
    }

    return new Response(JSON.stringify(parsedWorkoutPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
});
