const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyCnQPJPLmPCcnEXNNTBSWDCTKLY3nFxECw'
);

exports.streamingChatEnhanced = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable proxy buffering
  });

  try {
    const { message, systemPrompt, context, history } = req.body;
    
    console.log('Streaming chat request:', { 
      messageLength: message?.length,
      hasSystemPrompt: !!systemPrompt,
      hasContext: !!context,
      historyLength: history?.length 
    });

    // Initialize model with Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flashflash-exp',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    // Build conversation history
    const chatHistory = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Start chat with system instruction
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt || 'You are a helpful AI assistant.',
    });

    // Build enhanced message with context
    let enhancedMessage = message;
    if (context) {
      if (typeof context === 'string') {
        enhancedMessage += `\n\nContext: ${context}`;
      } else if (typeof context === 'object') {
        enhancedMessage += `\n\nContext: ${JSON.stringify(context, null, 2)}`;
      }
    }

    console.log('Sending to Gemini:', enhancedMessage.substring(0, 200) + '...');

    // Generate streaming response
    const result = await chat.sendMessageStream(enhancedMessage);

    // Stream the response
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        
        // Send SSE formatted data
        const data = JSON.stringify({ text: chunkText });
        res.write(`data: ${data}\n\n`);
        
        // Flush the response to ensure immediate delivery
        if (res.flush) res.flush();
      }
    }

    // Send completion signal
    res.write('data: [DONE]\n\n');
    
    console.log('Streaming complete. Total response length:', fullText.length);
    res.end();

  } catch (error) {
    console.error('Streaming chat error:', error);
    
    // Send error as SSE
    const errorData = JSON.stringify({ 
      error: error.message || 'An error occurred',
      text: 'I apologize, but I encountered an error. Please try again.'
    });
    res.write(`data: ${errorData}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Also create a generateWorkout function for structured workout generation
exports.generateWorkout = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { goals, context, conversation, userId } = req.body;
    
    console.log('Generating workout for user:', userId);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flashflash-exp',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    const prompt = `
Based on the following information, create a detailed weekly workout plan:

User Goals and Information:
${JSON.stringify(goals, null, 2)}

Additional Context:
${JSON.stringify(context, null, 2)}

Create a structured JSON workout plan with the following format:
{
  "title": "Descriptive workout plan title",
  "description": "Brief overview of the plan",
  "duration": "X weeks",
  "schedule": [
    {
      "day": "Monday",
      "name": "Workout name",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-10",
          "rest": "90 seconds",
          "notes": "Form tips or modifications"
        }
      ]
    }
  ],
  "progressionNotes": "How to progress over time",
  "tips": ["tip1", "tip2", "tip3"]
}

Make it specific, actionable, and tailored to their goals.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Try to parse as JSON, or return as structured text
    let workoutData;
    try {
      // Extract JSON from response if it's embedded in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workoutData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback structure
        workoutData = {
          title: "Personalized Workout Plan",
          description: response,
          schedule: [],
          rawPlan: response
        };
      }
    } catch (parseError) {
      console.log('Could not parse as JSON, returning as text');
      workoutData = {
        title: "Personalized Workout Plan",
        description: response,
        schedule: [],
        rawPlan: response
      };
    }

    res.json({
      success: true,
      data: workoutData
    });

  } catch (error) {
    console.error('Workout generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate workout'
    });
  }
});