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
    const { 
      message, 
      history = [], 
      userProfile = {}, 
      contextData = {},
      // New form context parameters - Issue #16
      formContext = null,
      exerciseType = null,
      coachingPreferences = {}
    } = req.body;
    
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

    // Add form analysis context if available - Issue #16
    if (formContext && exerciseType) {
      contextString += `\nForm Analysis Context for ${exerciseType}:\n`;
      contextString += `Exercise: ${formContext.exerciseName || exerciseType}\n`;
      
      if (formContext.userProfile) {
        contextString += `User Experience Level: ${formContext.userProfile.experienceLevel}\n`;
        contextString += `Competency Score: ${formContext.userProfile.competencyScore}/100\n`;
        contextString += `Session Count: ${formContext.userProfile.sessionCount}\n`;
      }
      
      if (formContext.currentSession) {
        contextString += `\nCurrent Session Analysis:\n`;
        contextString += `Overall Form Score: ${formContext.currentSession.overallScore}/100\n`;
        
        if (formContext.currentSession.criticalErrors?.length > 0) {
          contextString += `Critical Form Issues:\n`;
          formContext.currentSession.criticalErrors.forEach(error => {
            contextString += `  - ${error.type}: ${error.description}\n`;
            contextString += `    Correction: ${error.correction}\n`;
          });
        }
        
        if (formContext.currentSession.improvements?.length > 0) {
          contextString += `Improvement Suggestions:\n`;
          formContext.currentSession.improvements.forEach(imp => {
            contextString += `  - ${imp.category}: ${imp.suggestion}\n`;
          });
        }
      }
      
      if (formContext.progressContext?.hasHistory) {
        const progress = formContext.progressContext;
        contextString += `\nForm Progress History:\n`;
        contextString += `Recent Average Score: ${progress.recentPerformance.averageScore}/100\n`;
        contextString += `Best Score: ${progress.recentPerformance.bestScore}/100\n`;
        contextString += `Trend: ${progress.recentPerformance.trend}\n`;
        
        if (progress.commonIssues?.length > 0) {
          contextString += `Common Issues:\n`;
          progress.commonIssues.forEach(issue => {
            contextString += `  - ${issue.type} (${issue.percentage}% of sessions)\n`;
          });
        }
        
        if (progress.strengths?.length > 0) {
          contextString += `Form Strengths:\n`;
          progress.strengths.forEach(strength => {
            contextString += `  - ${strength.area}: ${strength.score}/100\n`;
          });
        }
      }
    }

    // Build form-aware system prompt - Issue #16
    let systemPrompt = `You are Coach Alex, an elite fitness coach with 15+ years of experience specializing in movement analysis and form correction. 
Your personality is warm, encouraging, and scientifically-minded. You adapt your communication style 
to match the user's experience level and energy.

${contextString}`;

    // Add form-specific coaching guidelines if form context is available
    if (formContext && exerciseType) {
      const coachingProfile = formContext.coachingProfile;
      if (coachingProfile) {
        systemPrompt += `\nForm Coaching Guidelines:
- Target Audience: ${coachingProfile.targetAudience} level athlete
- Communication Style: ${coachingProfile.communicationStyle}
- Tone: ${coachingProfile.tone}
- Focus Areas: ${coachingProfile.focusAreas?.join(', ') || 'General form improvement'}`;

        if (coachingProfile.guidelines) {
          systemPrompt += `\nSpecific Guidelines: ${coachingProfile.guidelines}`;
        }
      }

      systemPrompt += `\nForm-Specific Coaching Instructions:
- Always reference the user's current form analysis when giving advice
- Address critical errors first, then improvements
- Consider the user's experience level when explaining corrections
- Reference their progress history to motivate and guide
- Provide specific, actionable form cues
- Explain the biomechanical reasoning behind corrections when appropriate
- Consider injury risk factors in your recommendations`;
    }

    systemPrompt += `\nGeneral Guidelines:
- Be conversational and encouraging
- Provide specific, actionable advice
- Reference the user's history when relevant
- Ask follow-up questions to better understand their needs
- Use exercise science when explaining concepts
- Keep responses concise but informative
- Always prioritize safety and proper form over performance metrics`;

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

    // Save to chat history if user is authenticated - Issue #16 Enhanced
    if (req.body.userId) {
      try {
        const chatSession = {
          userId: req.body.userId,
          messages: [
            ...history,
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          // Add form context metadata
          formEnhanced: !!formContext,
          exerciseType: exerciseType || null,
          coachingStyle: coachingPreferences.style || 'supportive'
        };

        await db.collection('chatSessions').add(chatSession);

        // Save coaching interaction data for style adaptation
        if (formContext && exerciseType) {
          await db.collection('coachingInteractions').add({
            userId: req.body.userId,
            exerciseType,
            userMessage: message,
            aiResponse: response,
            formScore: formContext.currentSession?.overallScore || null,
            coachingStyle: coachingPreferences.style || 'supportive',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
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