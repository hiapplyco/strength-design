import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

// Fetch exercises from GitHub
const fetchExercises = async (): Promise<any[]> => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch exercises: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }
};

// Get the full image URL for an exercise image
const getFullImageUrl = (imagePath: string): string =>
  `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;

// Filter exercises based on the user's fitness level
const filterExercisesByLevel = (exercises: any[], level: string): any[] => {
  const levelMap: Record<string, string[]> = {
    beginner: ["beginner"],
    intermediate: ["beginner", "intermediate"],
    advanced: ["beginner", "intermediate", "expert"],
  };

  const allowedLevels = levelMap[level.toLowerCase()] || ["beginner"];
  return exercises.filter((ex) => allowedLevels.includes(ex.level)).slice(0, 30);
};

// Safely parse JSON with error handling
const safeJSONParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error("No valid JSON object found in text");
    } catch (e2) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Failed to parse workout plan JSON");
    }
  }
};

/* -------------------------------------------------------------------------- */
/*                             MAIN SERVER FUNCTION                           */
/* -------------------------------------------------------------------------- */

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Function called");

    // Extract parameters from the request body
    const {
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays,
    } = await req.json();
    console.log("Received params:", {
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays,
    });

    // Fetch and process exercises
    const exercises = await fetchExercises();
    console.log(`Fetched ${exercises.length} exercises`);

    const filteredExercises = filterExercisesByLevel(exercises, fitnessLevel);
    console.log(
      `Filtered to ${filteredExercises.length} exercises for level ${fitnessLevel}`
    );

    const processedExercises = filteredExercises.map((ex: any) => ({
      name: ex.name,
      equipment: ex.equipment,
      primaryMuscles: ex.primaryMuscles,
      level: ex.level,
      images: ex.images.map((img: string) => getFullImageUrl(img)),
    }));

    /* --------------------- Prepare Gemini API Request --------------------- */
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

    // Create the user prompt with detailed instructions
    const userPrompt = `
Generate a ${numberOfDays}-day workout program for a ${fitnessLevel}-level athlete.
Weather considerations: ${weatherPrompt}
Required exercises: ${prescribedExercises}
Additional requirements: ${prompt}

Format your response EXACTLY as a JSON object with this structure:
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

Available exercises (use exact names):
${JSON.stringify(
  processedExercises.map((ex) => ({
    name: ex.name,
    equipment: ex.equipment,
    level: ex.level,
  })),
  null,
  2
)}

IMPORTANT: Respond ONLY with the JSON object, no additional text or formatting.
`.trim();

    console.log("Sending request to Gemini...");
    const geminiResponse = await fetch(`${geminiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", errorData);
      throw new Error(
        `Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`
      );
    }

    const geminiData = await geminiResponse.json();
    console.log("Received Gemini API response");

    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response format from Gemini API");
    }

    let workoutText: string = geminiData.candidates[0].content.parts[0].text;
    console.log("Raw workout text:", workoutText);

    // Clean up the response text and parse it into a JSON object
    workoutText = workoutText.replace(/```json\s*|\s*```/g, "").trim();
    const parsedWorkoutPlan = safeJSONParse(workoutText);

    /* --------------------- Process Workout Plan to Add Images --------------------- */
    for (const day in parsedWorkoutPlan) {
      const dayPlan = parsedWorkoutPlan[day];
      const images = new Set<string>();

      // Helper to extract exercise names and add corresponding images
      const findExerciseImages = (text: string) => {
        if (!text) return;
        processedExercises.forEach((ex) => {
          if (text.toLowerCase().includes(ex.name.toLowerCase())) {
            ex.images.forEach((img: string) => images.add(img));
          }
        });
      };

      // Check multiple sections of the day plan for exercise names
      findExerciseImages(dayPlan.workout);
      findExerciseImages(dayPlan.warmup);
      findExerciseImages(dayPlan.strength);

      // Update the day's plan with the collected image URLs
      parsedWorkoutPlan[day].images = Array.from(images);
      console.log(`Day ${day} images:`, parsedWorkoutPlan[day].images);
    }

    /* --------------------- Save Workout Plan to Supabase --------------------- */
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from("generated_workouts").insert({
          user_id: session.user.id,
          workout_data: parsedWorkoutPlan,
          title: `${numberOfDays}-Day Workout Plan`,
          tags: [fitnessLevel],
          summary: `${numberOfDays}-day workout plan`,
        });
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      // Proceed even if saving fails
    }

    return new Response(JSON.stringify(parsedWorkoutPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
