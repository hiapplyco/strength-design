import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import * as admin from "firebase-admin";

// Initialize admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface UserExercise {
  exerciseId: string;
  name: string;
  category?: string;
  equipment?: string;
  primaryMuscles?: string[];
  customSets?: number;
  customReps?: string;
  customRest?: string;
}

export const streamingChatEnhanced = onRequest({
  timeoutSeconds: 300,
  memory: "1GiB",
  secrets: [geminiApiKey],
  cors: true
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Content-Type', 'text/event-stream');
  res.set('Cache-Control', 'no-cache');
  res.set('Connection', 'keep-alive');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { message, history = [], userProfile = {} } = req.body;
    
    if (!message) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Message is required' })}\n\n`);
      res.end();
      return;
    }

    // Get user's saved exercises if authenticated
    let savedExercises: UserExercise[] = [];
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        // Fetch user's saved exercises
        const exercisesSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('savedExercises')
          .where('isFavorite', '==', true)
          .limit(20)
          .get();
        
        exercisesSnapshot.forEach(doc => {
          const data = doc.data();
          savedExercises.push({
            exerciseId: doc.id,
            name: data.name,
            category: data.category,
            equipment: data.equipment,
            primaryMuscles: data.primaryMuscles,
            customSets: data.customSets,
            customReps: data.customReps,
            customRest: data.customRest,
          });
        });
      } catch (authError) {
        console.log("Auth error (continuing without saved exercises):", authError);
      }
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Service configuration error' })}\n\n`);
      res.end();
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build enhanced context with saved exercises
    let contextPrompt = `You are an expert fitness coach creating personalized workout programs.
Your responses should be friendly, motivational, and professional.

IMPORTANT WORKOUT GENERATION RULES:
1. Use markdown formatting with **bold** for emphasis
2. Structure workouts clearly with weeks, days, and exercises
3. Include sets, reps, rest periods, and tempo when relevant
4. Provide form cues and modifications
5. Be specific with exercise names and variations`;

    // Add user profile context
    if (userProfile.fitnessLevel || userProfile.goals || userProfile.equipment) {
      contextPrompt += `\n\nUSER PROFILE:
- Fitness Level: ${userProfile.fitnessLevel || 'Not specified'}
- Goals: ${userProfile.goals?.join(', ') || 'General fitness'}
- Training Frequency: ${userProfile.frequency || 'Not specified'} days/week
- Available Equipment: ${userProfile.equipment?.join(', ') || 'Not specified'}
- Injuries/Limitations: ${userProfile.injuries || 'None mentioned'}
- Time per Session: ${userProfile.timePerSession || 'Not specified'} minutes`;
    }

    // Add saved exercises context
    if (savedExercises.length > 0) {
      contextPrompt += `\n\nUSER'S FAVORITE EXERCISES:
The user has saved these exercises as favorites. Consider incorporating them when appropriate:`;
      
      savedExercises.forEach(exercise => {
        contextPrompt += `\n- ${exercise.name}`;
        if (exercise.equipment) contextPrompt += ` (${exercise.equipment})`;
        if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
          contextPrompt += ` - targets ${exercise.primaryMuscles.join(', ')}`;
        }
        if (exercise.customSets && exercise.customReps) {
          contextPrompt += ` - preferred: ${exercise.customSets} sets x ${exercise.customReps} reps`;
        }
      });
      
      contextPrompt += `\n\nWhen creating workouts, prioritize using these saved exercises where they fit the program goals.`;
    }

    // Format conversation history
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Ensure proper role ordering
    if (formattedHistory.length === 0 || formattedHistory[0].role !== 'user') {
      const initialPrompt = contextPrompt + "\n\n" + message;
      const result = await model.generateContentStream(initialPrompt);
      
      let fullResponse = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
      }
      
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        fullContent: fullResponse,
        usedSavedExercises: savedExercises.length > 0
      })}\n\n`);
    } else {
      // Add context to the first user message if not already added
      if (formattedHistory[0].parts[0].text.indexOf('USER PROFILE:') === -1) {
        formattedHistory[0].parts[0].text = contextPrompt + "\n\n" + formattedHistory[0].parts[0].text;
      }
      
      // Add current message
      formattedHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });
      
      const chat = model.startChat({ history: formattedHistory.slice(0, -1) });
      const result = await chat.sendMessageStream(message);
      
      let fullResponse = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
      }
      
      // Check if workout was generated and includes saved exercises
      const mentionedExercises = savedExercises.filter(exercise => 
        fullResponse.toLowerCase().includes(exercise.name.toLowerCase())
      );
      
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        fullContent: fullResponse,
        usedSavedExercises: mentionedExercises.length > 0,
        mentionedExercises: mentionedExercises.map(e => e.name)
      })}\n\n`);
    }

    res.end();

  } catch (error: any) {
    console.error("Streaming error:", error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: error.message || 'An error occurred during streaming' 
    })}\n\n`);
    res.end();
  }
});