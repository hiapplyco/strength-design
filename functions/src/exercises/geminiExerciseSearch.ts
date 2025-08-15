import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import * as https from 'https';

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const EXERCISE_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

interface Exercise {
  id: string;
  name: string;
  category?: string;
  equipment?: string;
  force?: string;
  level?: string;
  mechanic?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
}

const SEARCH_PROMPT = `You are an exercise search assistant. Based on the user's natural language query, extract the following search criteria:

1. Exercise names or types
2. Muscle groups (primary or secondary)
3. Equipment needed
4. Exercise category (strength, stretching, cardio, etc.)
5. Difficulty level (beginner, intermediate, expert)

Return a JSON object with these fields:
{
  "searchTerms": ["array of specific exercise names to search for"],
  "muscles": ["array of muscle groups"],
  "equipment": "specific equipment or 'any'",
  "category": "category or null",
  "level": "level or null"
}

Be specific and accurate. Map common terms to proper exercise terminology.`;

export const geminiExerciseSearch = onRequest({
  timeoutSeconds: 30,
  memory: "512MiB",
  secrets: [geminiApiKey],
  cors: true
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { query, userProfile } = req.body;
    
    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      res.status(500).json({ error: "Service configuration error" });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Add user context if available
    let contextualPrompt = SEARCH_PROMPT;
    if (userProfile) {
      contextualPrompt += `\n\nUser Context:
- Fitness Level: ${userProfile.fitnessLevel || 'unknown'}
- Goals: ${userProfile.goals?.join(', ') || 'general fitness'}
- Available Equipment: ${userProfile.equipment?.join(', ') || 'unknown'}
- Injuries/Limitations: ${userProfile.injuries || 'none'}`;
    }

    contextualPrompt += `\n\nUser Query: "${query}"`;

    // Get search criteria from Gemini
    const result = await model.generateContent(contextualPrompt);
    const response = result.response.text();
    
    console.log("Gemini search response:", response);

    // Parse the JSON response
    interface SearchCriteria {
      searchTerms: string[];
      muscles: string[];
      equipment: string;
      category: string | null;
      level: string | null;
    }
    
    let searchCriteria: SearchCriteria;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      searchCriteria = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      // Fallback to basic text search
      searchCriteria = {
        searchTerms: [query],
        muscles: [],
        equipment: 'any',
        category: null,
        level: null
      };
    }

    // Fetch exercise database
    const exercises: Exercise[] = await new Promise((resolve, reject) => {
      https.get(EXERCISE_DB_URL, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Failed to parse exercise data'));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    // Filter exercises based on Gemini's extracted criteria
    let filteredExercises = exercises;

    // Search by terms
    if (searchCriteria.searchTerms && searchCriteria.searchTerms.length > 0) {
      filteredExercises = filteredExercises.filter((exercise: Exercise) => {
        return searchCriteria.searchTerms.some((term: string) => {
          const searchTerm = term.toLowerCase();
          return (
            exercise.name?.toLowerCase().includes(searchTerm) ||
            exercise.category?.toLowerCase().includes(searchTerm) ||
            exercise.primaryMuscles?.some(muscle => 
              muscle.toLowerCase().includes(searchTerm)
            )
          );
        });
      });
    }

    // Filter by muscles
    if (searchCriteria.muscles && searchCriteria.muscles.length > 0) {
      filteredExercises = filteredExercises.filter((exercise: Exercise) => {
        return searchCriteria.muscles.some((muscle: string) => {
          const muscleLower = muscle.toLowerCase();
          return (
            exercise.primaryMuscles?.some(m => 
              m.toLowerCase().includes(muscleLower)
            ) ||
            exercise.secondaryMuscles?.some(m => 
              m.toLowerCase().includes(muscleLower)
            )
          );
        });
      });
    }

    // Filter by equipment
    if (searchCriteria.equipment && searchCriteria.equipment !== 'any') {
      filteredExercises = filteredExercises.filter((exercise: Exercise) => 
        exercise.equipment?.toLowerCase() === searchCriteria.equipment.toLowerCase()
      );
    }

    // Filter by category
    if (searchCriteria.category) {
      filteredExercises = filteredExercises.filter((exercise: Exercise) => 
        exercise.category?.toLowerCase() === searchCriteria.category?.toLowerCase()
      );
    }

    // Filter by level
    if (searchCriteria.level) {
      filteredExercises = filteredExercises.filter((exercise: Exercise) => 
        exercise.level?.toLowerCase() === searchCriteria.level?.toLowerCase()
      );
    }

    // Limit results
    const limitedExercises = filteredExercises.slice(0, 50);

    // Format exercises with full image URLs
    const formattedExercises = limitedExercises.map((exercise: Exercise) => ({
      ...exercise,
      exerciseId: exercise.id || exercise.name.toLowerCase().replace(/\s+/g, '-'),
      images: exercise.images?.map(image => 
        image.startsWith('http') ? image : `${IMAGE_BASE_URL}/${image}`
      )
    }));

    // Generate AI summary of results
    let aiSummary = '';
    if (formattedExercises.length > 0) {
      const summaryPrompt = `Briefly summarize these ${formattedExercises.length} exercises found for the query "${query}":
${formattedExercises.slice(0, 5).map(e => e.name).join(', ')}${formattedExercises.length > 5 ? '...' : ''}

Provide a 1-2 sentence summary of what was found.`;

      try {
        const summaryResult = await model.generateContent(summaryPrompt);
        aiSummary = summaryResult.response.text();
      } catch (summaryError) {
        console.error("Failed to generate summary:", summaryError);
        aiSummary = `Found ${formattedExercises.length} exercises matching your search.`;
      }
    } else {
      aiSummary = "No exercises found. Try different search terms or be less specific.";
    }

    res.status(200).json({
      exercises: formattedExercises,
      total: formattedExercises.length,
      searchCriteria: searchCriteria,
      aiSummary: aiSummary
    });

  } catch (error: any) {
    console.error("Error in Gemini exercise search:", error);
    res.status(500).json({ 
      error: error.message,
      details: "Failed to search exercises with AI"
    });
  }
});