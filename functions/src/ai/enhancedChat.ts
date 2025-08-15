import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const enhancedChat = onRequest({
    timeoutSeconds: 300,
    memory: "1GiB",
    secrets: [geminiApiKey]
  }, async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { 
          message, 
          history = [], 
          sessionId,
          sessionType = 'general',
          uploadedFiles = []
        } = req.body;

        console.log(`Enhanced chat - User: ${userId}, Session: ${sessionId}`);

        // Initialize Gemini API with secret
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
          console.error("GEMINI_API_KEY not configured");
          res.status(500).json({ error: "Service configuration error" });
          return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        const db = admin.firestore();
        
        // Initialize or get chat session
        interface ChatSession {
          id: string;
          user_id: string;
          session_type: string;
          uploaded_files: string[];
          created_at: admin.firestore.FieldValue;
          message_count: number;
        }
        
        let chatSession: ChatSession;
        if (sessionId) {
          const sessionDoc = await db.collection('chat_sessions').doc(sessionId).get();
          const sessionData = sessionDoc.data() || {};
          chatSession = { 
            id: sessionDoc.id, 
            user_id: sessionData.user_id || userId,
            session_type: sessionData.session_type || sessionType,
            uploaded_files: sessionData.uploaded_files || [],
            created_at: sessionData.created_at || admin.firestore.FieldValue.serverTimestamp(),
            message_count: sessionData.message_count || 0
          };
        } else {
          // Create new session
          const newSession = {
            user_id: userId,
            session_type: sessionType,
            uploaded_files: uploadedFiles,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            message_count: 0
          };
          const sessionRef = await db.collection('chat_sessions').add(newSession);
          chatSession = { id: sessionRef.id, ...newSession };
        }

        // Get user context
        const userContext = await getUserContext(userId, db);

        // Process uploaded files
        let filesContext = '';
        if (chatSession.uploaded_files && chatSession.uploaded_files.length > 0) {
          console.log(`Processing ${chatSession.uploaded_files.length} uploaded files`);
          
          for (const filePath of chatSession.uploaded_files) {
            try {
              const fileDoc = await db.collection('user_file_uploads')
                .where('storage_path', '==', filePath)
                .limit(1)
                .get();

              if (!fileDoc.empty) {
                const fileData = fileDoc.docs[0].data();
                filesContext += `\n\nFile: ${fileData.file_name} (${fileData.file_type})\n`;
                
                if (fileData.extracted_data) {
                  filesContext += `Extracted data: ${JSON.stringify(fileData.extracted_data)}\n`;
                }
                if (fileData.ai_analysis) {
                  filesContext += `Analysis: ${fileData.ai_analysis}\n`;
                }
              }
            } catch (error) {
              console.error(`Error processing file ${filePath}:`, error);
            }
          }
        }

        // Build comprehensive prompt
        const systemPrompt = `You are an expert AI fitness and nutrition coach with access to the user's complete fitness journey data. \n\n${sessionType === 'nutrition' ? 'Focus on nutrition, meal planning, and dietary advice.' : ''}\n${sessionType === 'workout' ? 'Focus on workout planning, exercise form, and training advice.' : ''}\n${sessionType === 'wellness' ? 'Focus on recovery, sleep, stress management, and overall wellness.' : ''}\n\nUser Context:\n- Profile: ${JSON.stringify(userContext.profile || {})}\n- Recent Workouts (${userContext.recentWorkouts?.length || 0}): ${JSON.stringify(userContext.recentWorkouts?.slice(0, 3) || [])}\n- Recent Nutrition (${userContext.recentNutrition?.length || 0} days): ${JSON.stringify(userContext.recentNutrition?.slice(0, 3) || [])}\n- Workout Templates: ${userContext.workoutTemplates || 0} saved\n- Uploaded Files: ${userContext.uploadedFiles || 0} total files\n\nSession Files Context:\n${filesContext || 'No files uploaded in this session'}\n\nInstructions:\n1. Use all available user data to provide personalized advice\n2. Reference specific data points from their history when relevant\n3. If files were uploaded, analyze and incorporate their content\n4. Extract and store any new profile information mentioned in the conversation\n5. Be specific and actionable in your recommendations\n6. For nutrition discussions, reference their macro targets and recent intake\n7. For workout discussions, consider their recent training and templates`;

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash"
        });

        // Build conversation history with system instruction
        const conversationHistory = [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will act as your expert AI fitness and nutrition coach with access to your complete fitness journey data.' }]
          },
          ...history.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }))
        ];
        
        const chat = model.startChat({
          history: conversationHistory
        });

        // Send message and get response
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        // Store messages in Firestore
        const batch = db.batch();
        
        // User message
        batch.set(db.collection('chat_messages').doc(), {
          session_id: chatSession.id,
          user_id: userId,
          role: 'user',
          content: message,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // Assistant response
        batch.set(db.collection('chat_messages').doc(), {
          session_id: chatSession.id,
          user_id: userId,
          role: 'assistant',
          content: response,
          model_used: 'gemini-2.5-flash',
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        // Update session
        await db.collection('chat_sessions').doc(chatSession.id).update({
          message_count: admin.firestore.FieldValue.increment(2),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // Extract profile data asynchronously
        extractProfileData(userId, message + ' ' + response, db);

        res.status(200).json({ 
          response,
          sessionId: chatSession.id,
          contextUsed: {
            workouts: userContext.recentWorkouts?.length || 0,
            nutrition: userContext.recentNutrition?.length || 0,
            files: chatSession.uploaded_files?.length || 0
          }
        });

      } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  });

// Helper function to get user context
async function getUserContext(userId: string, db: admin.firestore.Firestore) {
  try {
    // Get user profile
    const profileDoc = await db.collection('user_profiles').doc(userId).get();
    const profile = profileDoc.exists ? profileDoc.data() : {};

    // Get recent workouts
    const workoutsSnapshot = await db.collection(`users/${userId}/workouts`)
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();
    const recentWorkouts = workoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get recent nutrition logs
    const nutritionSnapshot = await db.collection(`users/${userId}/daily_nutrition_logs`)
      .orderBy('date', 'desc')
      .limit(7)
      .get();
    const recentNutrition = nutritionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Count workout templates
    const templatesSnapshot = await db.collection(`users/${userId}/workout_templates`).get();
    const workoutTemplates = templatesSnapshot.size;

    // Count uploaded files
    const filesSnapshot = await db.collection('user_file_uploads')
      .where('user_id', '==', userId)
      .get();
    const uploadedFiles = filesSnapshot.size;

    return {
      profile,
      recentWorkouts,
      recentNutrition,
      workoutTemplates,
      uploadedFiles
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return {};
  }
}

// Helper function to extract profile data from conversations
async function extractProfileData(userId: string, text: string, db: admin.firestore.Firestore) {
  try {
    const extractedData: any = {};

    // Age extraction
    const ageMatch = text.match(/(?:I am|I'm|age is|aged?)\s*(\d{1,3})\s*(?:years?|yo)?/i);
    if (ageMatch) extractedData.age = parseInt(ageMatch[1]);

    // Weight extraction
    const weightMatch = text.match(/(?:weigh|weight is|I'm)\s*(\d{2,3})(?:\.\d+)?\s*(?:kg|lbs?|pounds?)/i);
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      const unit = weightMatch[2].toLowerCase();
      extractedData.weight_kg = unit.includes('kg') ? weight : weight * 0.453592;
    }

    // Height extraction
    const heightMatch = text.match(/(?:height is|I'm|tall)\s*(\d{1,3})(?:\.\d+)?\s*(?:cm|m|feet|ft|'|")/i);
    if (heightMatch) {
      const height = parseFloat(heightMatch[1]);
      const unit = heightMatch[2].toLowerCase();
      if (unit.includes('cm')) extractedData.height_cm = height;
      else if (unit.includes('m')) extractedData.height_cm = height * 100;
      else if (unit.includes('f') || unit.includes("'")) extractedData.height_cm = height * 30.48;
    }

    // Goals extraction
    const goalKeywords = ['goal', 'want to', 'trying to', 'aim to', 'objective'];
    const goalMatches = text.match(new RegExp(`(?:${goalKeywords.join('|')})\\s+(?:is\\s+)?(.+?)(?:\\.|, |; |$)`, 'gi'));
    if (goalMatches) {
      extractedData.primary_goal = goalMatches[0].replace(/^.*?(goal|want to|trying to|aim to|objective)\\s+(?:is\\s+)?/i, '').trim();
    }

    // Training experience
    if (/beginner|new to|just start/i.test(text)) extractedData.training_experience = 'beginner';
    else if (/intermediate|some experience|few years/i.test(text)) extractedData.training_experience = 'intermediate';
    else if (/advanced|experienced|many years/i.test(text)) extractedData.training_experience = 'advanced';

    // Store extracted data if any found
    if (Object.keys(extractedData).length > 0) {
      await db.collection('user_profiles').doc(userId).set(extractedData, { merge: true });
      console.log(`Extracted profile data for user ${userId}:`, extractedData);
    }
  } catch (error) {
    console.error('Error extracting profile data:', error);
  }
}