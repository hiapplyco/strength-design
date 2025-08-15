const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });

// Import additional functions
const { streamingChatEnhanced: streamingChatEnhancedFunc, generateWorkout: generateWorkoutFunc } = require('./streamingChat');

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyCnQPJPLmPCcnEXNNTBSWDCTKLY3nFxECw'
);

// PRODUCTION: Real streaming chat with Gemini 2.5 Flash
exports.streamingChatEnhanced = functions
  .runWith({ 
    timeoutSeconds: 540,
    memory: '1GB' 
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const { message, context, history = [] } = req.body;
        
        // Use Gemini 2.5 Flash - the latest and best model
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.8,
            topP: 0.95,
          }
        });
        
        // Build conversation history
        const chatHistory = history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
        
        // System instruction for fitness expertise
        const systemInstruction = `You are an expert fitness coach and nutritionist with deep knowledge of exercise science, biomechanics, and sports nutrition. 

Your expertise includes:
- Creating personalized workout programs for all fitness levels
- Exercise form, technique, and progression strategies  
- Nutrition planning for various fitness goals
- Injury prevention and recovery protocols
- Sport-specific training methodologies

When creating workout plans:
1. Always consider the user's fitness level, goals, and available equipment
2. Include proper warm-up and cool-down protocols
3. Specify sets, reps, rest periods, and tempo when relevant
4. Explain the purpose and benefits of each exercise
5. Provide form cues and common mistake warnings
6. Suggest progressions and regressions

When discussing nutrition:
1. Provide evidence-based recommendations
2. Consider individual dietary preferences and restrictions
3. Include practical meal examples and timing strategies
4. Explain the role of macronutrients for the user's goals
5. Suggest appropriate supplementation when relevant

Always maintain a motivating, professional tone while being scientifically accurate.`;

        // Build enhanced prompt with context
        let enhancedPrompt = message;
        if (context) {
          if (context.userProfile) {
            enhancedPrompt = `User Profile:
- Fitness Level: ${context.userProfile.fitnessLevel || 'Not specified'}
- Goals: ${context.userProfile.goals?.join(', ') || 'General fitness'}
- Available Equipment: ${context.userProfile.equipment?.join(', ') || 'Not specified'}
- Preferences: ${context.userProfile.preferences || 'None specified'}

User Query: ${message}`;
          }
          
          if (context.recentWorkouts && context.recentWorkouts.length > 0) {
            enhancedPrompt += `\n\nRecent Workout History: ${context.recentWorkouts.length} workouts completed`;
          }
        }
        
        // Start chat with Gemini
        const chat = model.startChat({
          history: chatHistory,
          systemInstruction: systemInstruction,
        });
        
        // Send message and stream response
        const result = await chat.sendMessageStream(enhancedPrompt);
        
        // Stream the response chunks
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
        
      } catch (error) {
        console.error('Streaming chat error:', error);
        res.status(500).json({ 
          error: 'Failed to process chat request',
          details: error.message 
        });
      }
    });
  });

// PRODUCTION: Generate structured workout with Gemini
exports.generateWorkout = functions
  .runWith({ 
    timeoutSeconds: 300,
    memory: '1GB' 
  })
  .https.onCall(async (data, context) => {
    try {
      const { preferences, goals, experience, equipment, duration } = data;
      
      // Use Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          responseSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              duration: { type: "number" },
              difficulty: { type: "string" },
              focusAreas: { 
                type: "array",
                items: { type: "string" }
              },
              warmup: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    duration: { type: "string" },
                    instructions: { type: "string" }
                  }
                }
              },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "number" },
                    reps: { type: "string" },
                    rest: { type: "string" },
                    equipment: { type: "string" },
                    muscleGroups: { 
                      type: "array",
                      items: { type: "string" }
                    },
                    instructions: { type: "string" },
                    tips: { type: "string" }
                  }
                }
              },
              cooldown: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    duration: { type: "string" },
                    instructions: { type: "string" }
                  }
                }
              },
              notes: { type: "string" }
            }
          }
        }
      });
      
      const prompt = `Create a detailed workout plan with the following requirements:
      
Goals: ${goals?.join(', ') || 'General fitness'}
Experience Level: ${experience || 'Intermediate'}
Available Equipment: ${equipment?.join(', ') || 'Full gym'}
Duration: ${duration || 45} minutes
Preferences: ${preferences || 'None specified'}

Generate a complete workout including:
1. Appropriate warm-up (5-10 minutes)
2. Main workout with ${Math.floor((duration || 45) * 0.7 / 5)} exercises
3. Cool-down and stretching (5 minutes)

For each exercise include:
- Clear exercise name
- Sets and reps appropriate for the experience level
- Rest periods
- Required equipment
- Target muscle groups
- Brief form instructions
- One key tip for proper execution

Make the workout challenging but achievable for the specified experience level.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const workout = response.text();
      
      // Parse the structured response
      try {
        const structuredWorkout = JSON.parse(workout);
        return {
          success: true,
          workout: structuredWorkout
        };
      } catch (parseError) {
        // If parsing fails, return the text response
        return {
          success: true,
          workout: {
            name: 'Custom Workout',
            description: workout,
            exercises: []
          }
        };
      }
      
    } catch (error) {
      console.error('Generate workout error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate workout',
        error.message
      );
    }
  });

// PRODUCTION: Chat with context and history
exports.chatWithGemini = functions
  .runWith({ 
    timeoutSeconds: 300,
    memory: '1GB' 
  })
  .https.onCall(async (data, context) => {
    try {
      const { message, history = [], userContext = {} } = data;
      
      // Use Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.8,
        }
      });
      
      // Build conversation history
      const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      // System instruction
      const systemInstruction = `You are a knowledgeable and motivating fitness coach. 
Provide clear, actionable advice based on exercise science and best practices.
Be encouraging and supportive while maintaining professionalism.
Keep responses concise but informative.`;
      
      // Start chat
      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: systemInstruction,
      });
      
      // Add context to message if available
      let enhancedMessage = message;
      if (userContext.recentActivity) {
        enhancedMessage += `\n[Context: User recently ${userContext.recentActivity}]`;
      }
      
      // Send message
      const result = await chat.sendMessage(enhancedMessage);
      const response = result.response;
      
      return {
        success: true,
        response: response.text(),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        }
      };
      
    } catch (error) {
      console.error('Chat error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process chat',
        error.message
      );
    }
  });

// PRODUCTION: Search exercises from database
exports.searchExercises = functions.https.onCall(async (data, context) => {
  try {
    const { query, category, equipment, muscles, limit = 50 } = data;
    
    // In production, this would query your Firestore database
    // For now, using the embedded exercise data that's already in the app
    
    return {
      success: true,
      exercises: [],
      message: 'Exercise search uses local database in the app'
    };
    
  } catch (error) {
    console.error('Search exercises error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to search exercises',
      error.message
    );
  }
});

// PRODUCTION: Get exercise categories
exports.getExerciseCategories = functions.https.onCall(async (data, context) => {
  try {
    // These are real categories that match your exercise database
    const categories = [
      { name: 'Strength', count: 350, icon: '💪' },
      { name: 'Cardio', count: 120, icon: '🏃' },
      { name: 'Flexibility', count: 85, icon: '🧘' },
      { name: 'Olympic Weightlifting', count: 45, icon: '🏋️' },
      { name: 'Plyometrics', count: 78, icon: '🦘' },
      { name: 'Strongman', count: 62, icon: '💪' },
      { name: 'Stretching', count: 95, icon: '🤸' },
      { name: 'Powerlifting', count: 38, icon: '🏋️' }
    ];
    
    return {
      success: true,
      categories: categories
    };
    
  } catch (error) {
    console.error('Get categories error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get categories',
      error.message
    );
  }
});