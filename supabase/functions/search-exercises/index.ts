import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Exercise {
  name: string;
  instructions: string[];
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  images?: string[];
}

const exerciseDatabase: Exercise[] = [
  {
    name: "Push-ups",
    instructions: [
      "Start in a plank position with hands shoulder-width apart",
      "Lower your body until chest nearly touches the ground",
      "Push back up to the starting position"
    ],
    type: "Strength",
    muscle: "Chest",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    images: ["/lovable-uploads/push-ups-1.jpg", "/lovable-uploads/push-ups-2.jpg"]
  },
  {
    name: "Squats",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower your body as if sitting back into a chair",
      "Keep chest up and back straight",
      "Return to standing position"
    ],
    type: "Strength",
    muscle: "Legs",
    equipment: "Bodyweight",
    difficulty: "Beginner"
  },
  // Add more exercises as needed
];

serve(async (req) => {
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

    // Simple search implementation
    const results = exerciseDatabase.filter(exercise => 
      exercise.name.toLowerCase().includes(query.toLowerCase()) ||
      exercise.type.toLowerCase().includes(query.toLowerCase()) ||
      exercise.muscle.toLowerCase().includes(query.toLowerCase())
    );

    console.log('Found results:', results.length);

    return new Response(
      JSON.stringify({
        results: results.map(exercise => ({
          ...exercise,
          // Add a preview instruction
          preview: exercise.instructions[0]
        }))
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
