import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting workout generation process...");
    const startTime = Date.now();
    
    const { prompt } = await req.json();
    console.log("Received prompt:", prompt);

    const workouts = {
      "Monday": {
        description: "Push Day",
        warmup: "5 minutes light cardio\n3x10 arm circles\n2x10 shoulder rolls",
        workout: "3x10 push-ups\n4x12 dumbbell shoulder press\n3x15 tricep extensions",
        strength: "Bench Press: 4x8",
        notes: "Focus on form and controlled movements"
      },
      "Tuesday": {
        description: "Pull Day",
        warmup: "5 minutes rowing\n3x10 cat-cow stretches\n2x10 band pull-aparts",
        workout: "3x10 pull-ups\n4x12 dumbbell rows\n3x15 bicep curls",
        strength: "Deadlift: 4x6",
        notes: "Maintain proper back position throughout"
      },
      "Wednesday": {
        description: "Legs Day",
        warmup: "5 minutes jumping rope\n3x10 leg swings\n2x10 ankle rotations",
        workout: "3x10 squats\n4x12 lunges\n3x15 calf raises",
        strength: "Back Squat: 4x8",
        notes: "Focus on depth and knee alignment"
      },
      "Thursday": {
        description: "Upper Body Focus",
        warmup: "5 minutes jogging\n3x10 arm circles\n2x10 shoulder mobility",
        workout: "3x10 dips\n4x12 overhead press\n3x15 lateral raises",
        strength: "Military Press: 4x8",
        notes: "Emphasize shoulder stability"
      },
      "Friday": {
        description: "Lower Body Focus",
        warmup: "5 minutes cycling\n3x10 hip circles\n2x10 knee hugs",
        workout: "3x10 Romanian deadlifts\n4x12 leg press\n3x15 hip thrusts",
        strength: "Front Squat: 4x6",
        notes: "Maintain core engagement"
      },
      "Saturday": {
        description: "Full Body",
        warmup: "5 minutes burpees\n3x10 world's greatest stretch\n2x10 inchworms",
        workout: "3x10 clean and press\n4x12 kettlebell swings\n3x15 medicine ball slams",
        strength: "Power Clean: 4x5",
        notes: "Focus on explosive movements"
      },
      "Sunday": {
        description: "Recovery",
        warmup: "10 minutes light walking\n3x10 gentle stretches\n2x10 mobility work",
        workout: "Light yoga flow\n20 minutes mobility work\nGentle stretching routine",
        strength: "Bodyweight exercises only",
        notes: "Keep intensity low, focus on recovery"
      }
    };

    const endTime = Date.now();
    console.log(`Workout generation completed in ${endTime - startTime}ms`);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});