import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Fitness coach system prompt
const SYSTEM_PROMPT = `You are an elite AI fitness coach with expertise in exercise science, nutrition, and program design. 
Your communication style is:
- Encouraging and motivational
- Professional yet friendly
- Clear and concise
- Evidence-based

When creating workout programs:
1. Always start by understanding the user's current fitness level, goals, and constraints
2. Ask about available equipment, time constraints, and any injuries/limitations
3. Create progressive, structured programs with multiple cycles
4. Include warm-up, main work, and cool-down sections
5. Provide clear instructions for each exercise
6. Suggest modifications for different levels
7. Use markdown formatting for structure:
   - **Bold** for emphasis
   - ## Headers for sections
   - • Bullet points for lists
   - Numbers for sets/reps

When the user provides enough information, generate a complete workout program in this structure:
## Program Overview
- Duration, frequency, goals

## Week 1-2: Foundation
### Day 1: [Workout Name]
**Warm-up** (5-10 minutes)
• Exercise 1
• Exercise 2

**Main Workout**
1. Exercise Name - Sets x Reps (Rest: XX seconds)
   - Coaching cues
   - Modifications if needed
2. [Continue...]

**Cool-down** (5-10 minutes)
• Stretches

[Continue for all days and weeks...]`;

export const streamingChat = onRequest({
  timeoutSeconds: 300,
  memory: "1GiB",
  secrets: [geminiApiKey],
  cors: true
}, async (req: Request, res: Response) => {
  // Set up SSE headers for streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    const { message, history = [], userProfile = {} } = req.body;
    
    if (!message) {
      res.write(`data: ${JSON.stringify({ error: "Message is required" })}\n\n`);
      res.end();
      return;
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ error: "Service configuration error" })}\n\n`);
      res.end();
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      }
    });

    // Build context with user profile
    let contextPrompt = SYSTEM_PROMPT;
    if (userProfile.fitnessLevel || userProfile.goals || userProfile.equipment) {
      contextPrompt += `\n\nUser Profile:
- Fitness Level: ${userProfile.fitnessLevel || 'Not specified'}
- Goals: ${userProfile.goals?.join(', ') || 'Not specified'}
- Training Frequency: ${userProfile.frequency || 'Not specified'} days/week
- Available Equipment: ${userProfile.equipment?.join(', ') || 'Not specified'}
- Injuries/Limitations: ${userProfile.injuries || 'None specified'}
- Time per Session: ${userProfile.timePerSession || 'Not specified'} minutes`;
    }

    // Convert history to Gemini format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content || msg.text || '' }]
    }));

    // Start chat session with system context
    const chatHistory = [];
    
    // Add system context as first exchange if this is the start of conversation
    if (formattedHistory.length === 0) {
      // For first message, include context in the system prompt
      const initialPrompt = contextPrompt + "\n\n" + message;
      const result = await model.generateContentStream(initialPrompt);
      
      let fullResponse = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk',
          content: chunkText 
        })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ 
        type: 'complete',
        fullContent: fullResponse 
      })}\n\n`);

      // Analyze if this is a complete workout program
      if (fullResponse.includes('## Program Overview') || 
          fullResponse.includes('## Week') || 
          fullResponse.includes('### Day')) {
        res.write(`data: ${JSON.stringify({ 
          type: 'workout_generated',
          canSave: true 
        })}\n\n`);
      }

      res.end();
      return;
    }
    
    // For ongoing conversation, ensure proper role alternation
    if (formattedHistory.length > 0) {
      // Make sure first message is from user
      if (formattedHistory[0].role === 'model') {
        chatHistory.push({ role: 'user', parts: [{ text: 'Hello' }] });
      }
      chatHistory.push(...formattedHistory);
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    });

    // Stream the response
    const result = await chat.sendMessageStream(message);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      
      // Send chunk to client
      res.write(`data: ${JSON.stringify({ 
        type: 'chunk',
        content: chunkText 
      })}\n\n`);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      type: 'complete',
      fullContent: fullResponse 
    })}\n\n`);

    // Analyze if this is a complete workout program
    if (fullResponse.includes('## Program Overview') || 
        fullResponse.includes('## Week') || 
        fullResponse.includes('### Day')) {
      res.write(`data: ${JSON.stringify({ 
        type: 'workout_generated',
        canSave: true 
      })}\n\n`);
    }

    res.end();
  } catch (error: any) {
    console.error('Streaming chat error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      error: error.message 
    })}\n\n`);
    res.end();
  }
});