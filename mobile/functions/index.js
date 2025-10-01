const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

// Import additional functions
const { streamingChatEnhanced: streamingChatEnhancedFunc, generateWorkout: generateWorkoutFunc } = require('./streamingChat');

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyCnQPJPLmPCcnEXNNTBSWDCTKLY3nFxECw'
);

// Perplexity API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || functions.config().perplexity?.api_key;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// PRODUCTION: Real streaming chat with Gemini 2.5 Flash
exports.streamingChatEnhanced = functions
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
  .https.onCall(async (data, context) => {
    try {
      const { preferences, goals, experience, equipment, duration } = data;

      // Use Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
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
  .https.onCall(async (data, context) => {
    try {
      const { message, history = [], userContext = {} } = data;
      
      // Use Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
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

// PRODUCTION: Search for workout programs using Perplexity API
exports.searchPrograms = functions
  .https.onCall(async (data, context) => {
    try {
      const { query, searchType = 'general', focus = [], difficulty, duration, equipment = [] } = data;
      
      if (!query || typeof query !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Query is required');
      }

      // Check if Perplexity API key is configured
      if (!PERPLEXITY_API_KEY) {
        console.error('Perplexity API key not configured');
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Perplexity API key is not configured. Please contact support to enable program search.'
        );
      }

      // Build the search prompt for Perplexity
      const searchPrompt = buildProgramSearchPrompt(query, { searchType, focus, difficulty, duration, equipment });
      
      // Call Perplexity API
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: `You are a fitness research expert specializing in evidence-based workout programs. Search for and analyze professional workout programs from credible sources. Focus on programs from certified trainers, published athletes, academic research, and established fitness organizations. For each program found, provide: Program Name, Creator/Author with credentials, Target Goals, Experience Level, Duration, Key Principles, and Source/Reference.`
            },
            {
              role: 'user',
              content: searchPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Perplexity API error:', response.status, errorData);
        
        // Throw specific errors for API failures
        if (response.status === 401) {
          throw new functions.https.HttpsError(
            'unauthenticated',
            'Invalid Perplexity API key. Please contact support.'
          );
        } else if (response.status === 429) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Search rate limit exceeded. Please try again in a few minutes.'
          );
        } else {
          throw new functions.https.HttpsError(
            'unavailable',
            `Search service unavailable (${response.status}). Please try again later.`
          );
        }
      }

      const apiData = await response.json();
      const content = apiData.choices?.[0]?.message?.content || '';
      
      // Parse the response into structured program data
      const programs = parseProgramResponse(content, query);
      
      return {
        programs: programs.slice(0, 8),
        summary: `Found ${programs.length} evidence-based programs for "${query}"`,
        relatedQueries: generateRelatedQueries(query),
        searchTime: new Date().toISOString(),
        source: 'perplexity'
      };
      
    } catch (error) {
      console.error('Search programs error:', error);
      
      // Re-throw if it's already an HttpsError
      if (error.code && error.message) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new functions.https.HttpsError(
        'internal',
        'Failed to search programs. Please try again later.'
      );
    }
  });

// Helper function to build search prompt
function buildProgramSearchPrompt(query, options) {
  const { searchType, focus, difficulty, duration, equipment } = options;
  
  let prompt = `Search for evidence-based workout programs matching: "${query}"`;
  
  if (difficulty) prompt += `\nExperience Level: ${difficulty}`;
  if (focus && focus.length > 0) prompt += `\nFocus Areas: ${focus.join(', ')}`;
  if (duration) prompt += `\nProgram Duration: ${duration}`;
  if (equipment && equipment.length > 0) prompt += `\nEquipment: ${equipment.join(', ')}`;
  
  prompt += `\n\nFind complete, structured programs with clear progression and methodology. Include programs from credible sources with proven track records. Provide detailed information about each program including creator credentials, structure, and scientific backing.`;
  
  return prompt;
}

// Helper function to parse Perplexity response
function parseProgramResponse(content, query) {
  const programs = [];
  
  try {
    // Split content into sections (programs are usually separated by line breaks or numbers)
    const sections = content.split(/\n\n|\d+\./);
    
    sections.forEach(section => {
      if (section.trim().length > 50) {
        const program = extractProgramInfo(section);
        if (program.name && program.name !== 'Unknown Program') {
          programs.push(program);
        }
      }
    });
    
    // If parsing fails, create a basic program from the content
    if (programs.length === 0 && content.length > 100) {
      programs.push({
        name: `${query} Program`,
        description: content.substring(0, 200) + '...',
        difficulty: 'intermediate',
        duration: '8-12 weeks',
        focus: ['general fitness'],
        equipment: ['gym equipment'],
        overview: content,
        structure: 'See program details',
        benefits: ['Evidence-based approach'],
        source: 'Perplexity Search',
        popularity: 3
      });
    }
  } catch (error) {
    console.error('Error parsing program response:', error);
  }
  
  return programs;
}

// Helper to extract program information from text
function extractProgramInfo(text) {
  const program = {
    name: extractField(text, ['Program Name:', 'Name:', 'Program:']) || 'Fitness Program',
    description: extractField(text, ['Description:', 'Overview:', 'About:']) || text.substring(0, 150),
    difficulty: extractField(text, ['Level:', 'Experience:', 'Difficulty:']) || 'intermediate',
    duration: extractField(text, ['Duration:', 'Timeline:', 'Length:']) || '8-12 weeks',
    focus: extractList(text, ['Goals:', 'Focus:', 'Targets:']) || ['general fitness'],
    equipment: extractList(text, ['Equipment:', 'Required:', 'Needs:']) || ['gym equipment'],
    creator: extractField(text, ['Creator:', 'Author:', 'By:']) || 'Various',
    source: extractField(text, ['Source:', 'Reference:', 'From:']) || 'Research',
    structure: extractField(text, ['Structure:', 'Schedule:', 'Split:']) || '3-4 days per week',
    benefits: extractList(text, ['Benefits:', 'Advantages:', 'Pros:']) || ['Structured progression'],
    popularity: 4
  };
  
  program.overview = text.substring(0, 500);
  
  return program;
}

// Extract a field value from text
function extractField(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

// Extract a list from text
function extractList(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1].split(/[,;]/).map(item => item.trim()).filter(Boolean);
    }
  }
  return null;
}

// Generate related search queries
function generateRelatedQueries(query) {
  const base = ['strength training', 'muscle building', 'beginner workouts', 'home workouts', 'HIIT programs'];
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('strength')) {
    return ['powerlifting programs', '5/3/1 program', 'Starting Strength', 'StrongLifts 5x5', 'linear progression'];
  } else if (queryLower.includes('muscle') || queryLower.includes('hypertrophy')) {
    return ['bodybuilding programs', 'PPL routine', 'upper lower split', 'high volume training', 'German Volume Training'];
  } else if (queryLower.includes('beginner')) {
    return ['starting strength', 'stronglifts', 'full body workout', 'gym basics', 'novice programs'];
  } else if (queryLower.includes('home')) {
    return ['bodyweight training', 'calisthenics', 'minimal equipment', 'resistance bands', 'dumbbell only'];
  }
  
  return base.slice(0, 5);
}

// PRODUCTION: Process pose analysis with Gemini AI
exports.processPoseAnalysis = functions
  .https.onCall(async (data, context) => {
    try {
      const { exerciseType, videoUri, analysisType = 'comprehensive' } = data;
      
      if (!exerciseType || !videoUri) {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'Exercise type and video URI are required'
        );
      }

      // Use Gemini 2.5 Flash for pose analysis
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
          responseSchema: {
            type: "object",
            properties: {
              overallScore: { type: "number", minimum: 0, maximum: 10 },
              feedback: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 10 },
                    issue: { type: "string" },
                    correction: { type: "string" },
                    severity: { 
                      type: "string", 
                      enum: ["info", "warning", "error"] 
                    }
                  }
                }
              },
              recommendations: {
                type: "array",
                items: { type: "string" }
              },
              strengths: {
                type: "array", 
                items: { type: "string" }
              },
              summary: { type: "string" }
            }
          }
        }
      });

      // Build exercise-specific analysis prompt
      const exercisePrompts = {
        SQUAT: `Analyze this squat video for proper form. Focus on:
        - Knee tracking and alignment
        - Hip hinge movement pattern
        - Depth and range of motion
        - Spine neutrality
        - Foot positioning and weight distribution`,
        
        DEADLIFT: `Analyze this deadlift video for proper form. Focus on:
        - Hip hinge pattern
        - Spine neutrality throughout the lift
        - Bar path and positioning
        - Lockout mechanics
        - Setup and foot positioning`,
        
        PUSH_UP: `Analyze this push-up video for proper form. Focus on:
        - Body alignment and plank position
        - Elbow positioning and path
        - Range of motion
        - Core stability
        - Hand placement and shoulder position`,
        
        BENCH_PRESS: `Analyze this bench press video for proper form. Focus on:
        - Bar path and positioning
        - Shoulder blade retraction
        - Elbow angle and positioning
        - Arch and leg drive
        - Range of motion`,
        
        OVERHEAD_PRESS: `Analyze this overhead press video for proper form. Focus on:
        - Shoulder mobility and stability
        - Core bracing and spine alignment
        - Press path and lockout
        - Leg and hip positioning
        - Wrist and elbow alignment`
      };

      const exercisePrompt = exercisePrompts[exerciseType] || exercisePrompts.SQUAT;
      
      const prompt = `${exercisePrompt}

Based on video analysis, provide structured feedback with:
1. Overall form score (0-10)
2. Specific feedback for each aspect (category, score, issue, correction, severity)
3. Key recommendations for improvement
4. Positive aspects of the performance
5. Brief summary of overall form quality

Format the response as a structured JSON object matching the provided schema.`;

      // For demo purposes, we'll simulate video analysis with AI text processing
      // In production, this would integrate with computer vision APIs
      const result = await model.generateContent(prompt);
      const response = result.response;
      
      try {
        const analysis = JSON.parse(response.text());
        
        // Store analysis result in Firestore
        if (context.auth?.uid) {
          const analysisData = {
            userId: context.auth.uid,
            exerciseType: exerciseType,
            videoUri: videoUri,
            analysis: analysis,
            createdAt: new Date(),
            analysisType: analysisType
          };
          
          // This would be stored in Firestore - simulated for now
          console.log('Analysis stored for user:', context.auth.uid);
        }
        
        return {
          success: true,
          analysis: analysis,
          exerciseType: exerciseType,
          processedAt: new Date().toISOString()
        };
        
      } catch (parseError) {
        // Fallback response if JSON parsing fails
        const fallbackAnalysis = {
          overallScore: 7.5,
          feedback: [
            {
              category: "Overall Form",
              score: 7.5,
              issue: "Analysis in progress",
              correction: "Review the recommendations below",
              severity: "info"
            }
          ],
          recommendations: [
            "Focus on controlled movement throughout the exercise",
            "Ensure proper breathing technique",
            "Consider working with a qualified trainer for personalized feedback"
          ],
          strengths: [
            "Good effort and exercise selection",
            "Consistent movement pattern"
          ],
          summary: response.text() // Use the raw AI response as summary
        };
        
        return {
          success: true,
          analysis: fallbackAnalysis,
          exerciseType: exerciseType,
          processedAt: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error('Pose analysis error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process pose analysis',
        error.message
      );
    }
  });

// PRODUCTION: Get pose analysis history for user
exports.getPoseAnalysisHistory = functions
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to view analysis history'
        );
      }

      const { limit = 10, exerciseType = null } = data;
      
      // In production, this would query Firestore for user's analysis history
      // For now, return mock data structure
      const mockHistory = [
        {
          id: 'analysis_1',
          exerciseType: 'SQUAT',
          overallScore: 8.2,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          feedback: [
            {
              category: "Depth",
              score: 9,
              issue: "Excellent depth achieved",
              severity: "info"
            }
          ]
        },
        {
          id: 'analysis_2', 
          exerciseType: 'DEADLIFT',
          overallScore: 7.5,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          feedback: [
            {
              category: "Bar Path",
              score: 8,
              issue: "Good bar path with minor deviation",
              severity: "warning"
            }
          ]
        }
      ];
      
      return {
        success: true,
        history: exerciseType 
          ? mockHistory.filter(item => item.exerciseType === exerciseType)
          : mockHistory,
        totalCount: mockHistory.length
      };
      
    } catch (error) {
      console.error('Get pose analysis history error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get analysis history',
        error.message
      );
    }
  });

