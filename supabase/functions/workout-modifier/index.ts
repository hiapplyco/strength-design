import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interfaces for type safety and validation
interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: string | number;
  duration?: string;
  rest?: string;
  instructions?: string;
  notes?: string;
  modifications?: {
    beginner?: string;
    advanced?: string;
  };
}

interface WorkoutDay {
  title: string;
  focus: string;
  warmup: {
    duration: string;
    exercises: WorkoutExercise[];
  };
  mainWorkout: WorkoutExercise[];
  strengthFocus?: {
    area: string;
    exercises: WorkoutExercise[];
  };
  cooldown?: {
    duration: string;
    exercises: WorkoutExercise[];
  };
  coachingNotes: string;
  nutrition?: {
    hydration: string;
    preWorkout?: string;
    postWorkout?: string;
  };
  recovery?: {
    suggestions: string[];
    estimatedFatigue: string;
  };
}

interface WorkoutPlan {
  metadata: {
    fitnessLevel: string;
    weatherConditions: string;
    durationDays: number;
    targetAreas: string[];
    equipment: string[];
    goals: string[];
  };
  days: Record<string, WorkoutDay>;
}

interface ModificationRequest {
  dayToModify: string;
  modificationPrompt: string;
  modificationType?: "exercise" | "intensity" | "duration" | "complete" | "equipment";
  allWorkouts: Record<string, WorkoutDay>;
  metadata?: WorkoutPlan["metadata"];
  reason?: string;
}

// Function to validate workout structure
function validateWorkoutDay(workout: any): boolean {
  return (
    workout &&
    typeof workout.title === "string" &&
    typeof workout.focus === "string" &&
    workout.warmup &&
    Array.isArray(workout.warmup.exercises) &&
    Array.isArray(workout.mainWorkout) &&
    typeof workout.coachingNotes === "string"
  );
}

// Function to get adjacent days for context
function getAdjacentDays(allWorkouts: Record<string, WorkoutDay>, dayToModify: string): {
  previousDay?: { key: string; summary: string };
  nextDay?: { key: string; summary: string };
} {
  const days = Object.keys(allWorkouts).sort();
  const currentIndex = days.indexOf(dayToModify);
  
  const result: {
    previousDay?: { key: string; summary: string };
    nextDay?: { key: string; summary: string };
  } = {};
  
  if (currentIndex > 0) {
    const prevKey = days[currentIndex - 1];
    result.previousDay = {
      key: prevKey,
      summary: `${prevKey}: ${allWorkouts[prevKey].title} (${allWorkouts[prevKey].focus})`
    };
  }
  
  if (currentIndex < days.length - 1) {
    const nextKey = days[currentIndex + 1];
    result.nextDay = {
      key: nextKey,
      summary: `${nextKey}: ${allWorkouts[nextKey].title} (${allWorkouts[nextKey].focus})`
    };
  }
  
  return result;
}

// Function to summarize the workout plan for context
function summarizeWorkoutPlan(allWorkouts: Record<string, WorkoutDay>, metadata?: WorkoutPlan["metadata"]): string {
  const days = Object.keys(allWorkouts).sort();
  let summary = "Overall Workout Plan Structure:\n";
  
  days.forEach(day => {
    summary += `- ${day}: ${allWorkouts[day].title} (${allWorkouts[day].focus})\n`;
  });
  
  if (metadata) {
    summary += "\nWorkout Plan Metadata:\n";
    summary += `- Fitness Level: ${metadata.fitnessLevel}\n`;
    summary += `- Duration: ${metadata.durationDays} days\n`;
    summary += `- Goals: ${metadata.goals.join(", ")}\n`;
    summary += `- Target Areas: ${metadata.targetAreas.join(", ")}\n`;
    summary += `- Equipment: ${metadata.equipment.join(", ")}\n`;
  }
  
  return summary;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { 
      dayToModify, 
      modificationPrompt, 
      modificationType = "complete", 
      allWorkouts, 
      metadata,
      reason = "" 
    } = await req.json() as ModificationRequest;
    
    console.log('Modifying workout with params:', { dayToModify, modificationPrompt, modificationType });
    
    // Get context from adjacent days
    const adjacentDays = getAdjacentDays(allWorkouts, dayToModify);
    
    // Get workout plan summary
    const planSummary = summarizeWorkoutPlan(allWorkouts, metadata);
    
    // Build a smarter prompt with context
    const prompt = `
      I need to modify the workout for ${dayToModify} in a fitness plan according to this request: "${modificationPrompt}"
      ${reason ? `\nThe reason for this modification is: ${reason}` : ""}
      
      ${planSummary}
      
      ${adjacentDays.previousDay ? 
        `The previous day (${adjacentDays.previousDay.key}) focuses on: ${adjacentDays.previousDay.summary}` : 
        "This is the first day of the workout plan."}
      
      ${adjacentDays.nextDay ? 
        `The next day (${adjacentDays.nextDay.key}) focuses on: ${adjacentDays.nextDay.summary}` : 
        "This is the last day of the workout plan."}
      
      CURRENT WORKOUT FOR ${dayToModify}:
      ${JSON.stringify(allWorkouts[dayToModify], null, 2)}
      
      MODIFICATION GUIDELINES:
      1. Maintain the same JSON structure exactly as shown above
      2. The modification should be contextually appropriate considering the overall workout plan
      3. ${modificationType === "exercise" ? "Replace specific exercises while maintaining the same workout structure and intensity" : ""}
      4. ${modificationType === "intensity" ? "Adjust the intensity (sets, reps, rest periods) while keeping the same exercises" : ""}
      5. ${modificationType === "duration" ? "Modify the workout to fit the requested duration while preserving key exercises" : ""}
      6. ${modificationType === "equipment" ? "Replace exercises to accommodate different equipment while maintaining the workout's focus" : ""}
      7. ${modificationType === "complete" ? "Make comprehensive changes as requested while preserving the workout's purpose" : ""}
      8. Ensure progression and recovery makes sense in context of the surrounding days
      9. Keep any existing fields in the JSON structure even if they're not modified
      10. Ensure all exercises are realistic and properly described
      
      Return ONLY the modified JSON for ${dayToModify}, with the exact same structure and field names as the original.
      Do not include code blocks, markdown, or any text explanation before or after the JSON.
    `;
    
    // Generate the modified workout
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 6000,
        temperature: 0.7
      }
    });
    
    const response = result.response;
    console.log('Response received from Gemini');
    
    // Process and parse the response
    let parsedResponse;
    try {
      // Clean up the response
      const cleanedResponse = response.text().replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
      
      // Validate structure
      if (!validateWorkoutDay(parsedResponse)) {
        throw new Error('Modified workout has invalid structure');
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      
      // Attempt to extract any JSON-like structure
      const match = response.text().match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResponse = JSON.parse(match[0]);
          if (!validateWorkoutDay(parsedResponse)) {
            throw new Error('Modified workout has invalid structure');
          }
        } catch {
          throw new Error('Failed to parse modified workout data');
        }
      } else {
        throw new Error('Failed to parse modified workout data');
      }
    }
    
    // Return with both the original and modified workout
    return new Response(
      JSON.stringify({
        original: allWorkouts[dayToModify],
        modified: parsedResponse,
        day: dayToModify
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error modifying workout:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "Failed to modify workout. Please try again with different parameters."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
