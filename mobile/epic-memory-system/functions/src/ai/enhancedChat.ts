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

export const enhancedChat = onRequest({
  timeoutSeconds: 300,
  memory: "1GiB",
  secrets: [geminiApiKey],
  cors: true  // Enable CORS for all origins
}, async (req: Request, res: Response) => {
  
  // Set comprehensive CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { message, history = [], userProfile = {}, contextData = {} } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      console.error('Gemini API key not configured');
      res.status(500).json({ error: 'AI service not configured' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      }
    });

    // Build conversation history for context
    // Filter out any assistant messages at the beginning to prevent consecutive model messages
    let cleanHistory = history || [];
    // Remove leading assistant messages
    while (cleanHistory.length > 0 && cleanHistory[0].role === 'assistant') {
      cleanHistory = cleanHistory.slice(1);
    }
    
    // Ensure alternating user/model messages
    const conversationHistory: any[] = [];
    let lastRole: string | null = null;
    
    for (const msg of cleanHistory) {
      const currentRole = msg.role === 'user' ? 'user' : 'model';
      // Skip if we have consecutive messages with the same role
      if (lastRole === currentRole) {
        continue;
      }
      conversationHistory.push({
        role: currentRole,
        parts: [{ text: msg.content || '' }]
      });
      lastRole = currentRole;
    }

    // Build context string from various sources
    let contextString = '';
    
    if (userProfile && Object.keys(userProfile).length > 0) {
      contextString += `\nUser Profile:\n${JSON.stringify(userProfile, null, 2)}\n`;
    }
    
    if (contextData) {
      if (contextData.recentWorkouts?.length > 0) {
        contextString += `\nRecent Workouts:\n${JSON.stringify(contextData.recentWorkouts, null, 2)}\n`;
      }
      if (contextData.favoriteExercises?.length > 0) {
        contextString += `\nFavorite Exercises:\n${JSON.stringify(contextData.favoriteExercises, null, 2)}\n`;
      }
      if (contextData.searchContext) {
        contextString += `\nSearch Context:\n${contextData.searchContext}\n`;
      }
    }

    // System prompt for the AI coach
    const systemPrompt = `You are Coach Alex, an elite fitness coach with 15+ years of experience. 
Your personality is warm, encouraging, and scientifically-minded. You adapt your communication style 
to match the user's experience level and energy.

${contextString}

Guidelines:
- Be conversational and encouraging
- Provide specific, actionable advice
- Reference the user's history when relevant
- Ask follow-up questions to better understand their needs
- Use exercise science when explaining concepts
- Keep responses concise but informative`;

    // Build full history ensuring no consecutive model messages
    const fullHistory: any[] = [];
    
    // Add system prompt only if first message isn't from user or if no history
    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'user') {
      fullHistory.push(
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood! I\'ll be Coach Alex and help with fitness guidance.' }] }
      );
    }
    
    // Add conversation history
    fullHistory.push(...conversationHistory);
    
    // If history ends with model message or is empty after system prompt, add current user message
    if (fullHistory.length === 0 || fullHistory[fullHistory.length - 1].role === 'model') {
      // Current message will be sent via sendMessage
    } else if (fullHistory[fullHistory.length - 1].role === 'user') {
      // Remove last user message if it exists (will be sent via sendMessage)
      fullHistory.pop();
    }

    // Generate response
    const chat = model.startChat({
      history: fullHistory
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Save to chat history if user is authenticated
    if (req.body.userId) {
      try {
        await db.collection('chatSessions').add({
          userId: req.body.userId,
          messages: [
            ...history,
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }

    res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message 
    });
  }
});