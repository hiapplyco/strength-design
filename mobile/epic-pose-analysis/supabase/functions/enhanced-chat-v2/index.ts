import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      message, 
      history = [], 
      sessionId,
      sessionType = 'general',
      uploadedFiles = [] // Array of file paths uploaded in this session
    } = await req.json();

    console.log(`Enhanced chat v2 - User: ${user.id}, Session: ${sessionId}`);

    // Initialize or get chat session
    let chatSession;
    if (sessionId) {
      const { data } = await supabaseAdmin
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      chatSession = data;
    } else {
      // Create new session
      const { data } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          session_type: sessionType,
          uploaded_files: uploadedFiles
        })
        .select()
        .single();
      chatSession = data;
    }

    // Get complete user context using the SQL function
    const { data: userContextData } = await supabaseAdmin
      .rpc('get_user_complete_context', { p_user_id: user.id });

    // Process all uploaded files in the session
    let filesContext = '';
    if (chatSession.uploaded_files && chatSession.uploaded_files.length > 0) {
      console.log(`Processing ${chatSession.uploaded_files.length} uploaded files`);
      
      for (const filePath of chatSession.uploaded_files) {
        try {
          // Get file metadata
          const { data: fileRecord } = await supabaseAdmin
            .from('user_file_uploads')
            .select('*')
            .eq('storage_path', filePath)
            .single();

          if (fileRecord) {
            filesContext += `\n\nFile: ${fileRecord.file_name} (${fileRecord.file_type})\n`;
            
            // Include extracted data if available
            if (fileRecord.extracted_data) {
              filesContext += `Extracted data: ${JSON.stringify(fileRecord.extracted_data)}\n`;
            }
            if (fileRecord.ai_analysis) {
              filesContext += `Analysis: ${fileRecord.ai_analysis}\n`;
            }
          }

          // For images, we can include them in the Gemini request
          if (fileRecord?.file_type?.startsWith('image/')) {
            // Download and convert to base64
            const { data: fileData } = await supabaseClient.storage
              .from(filePath.split('/')[0]) // Extract bucket name
              .download(filePath.substring(filePath.indexOf('/') + 1));

            if (fileData) {
              const arrayBuffer = await fileData.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              filesContext += `[Image data included for analysis]\n`;
            }
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    }

    // Build comprehensive prompt
    const systemPrompt = `You are an expert AI fitness and nutrition coach with access to the user's complete fitness journey data. 

${sessionType === 'nutrition' ? 'Focus on nutrition, meal planning, and dietary advice.' : ''}
${sessionType === 'workout' ? 'Focus on workout planning, exercise form, and training advice.' : ''}
${sessionType === 'wellness' ? 'Focus on recovery, sleep, stress management, and overall wellness.' : ''}

User Context:
- Profile: ${JSON.stringify(userContextData?.profile || {})}
- Recent Workouts (${userContextData?.recent_workouts?.length || 0}): ${JSON.stringify(userContextData?.recent_workouts?.slice(0, 3) || [])}
- Recent Nutrition (${userContextData?.recent_nutrition?.length || 0} days): ${JSON.stringify(userContextData?.recent_nutrition?.slice(0, 3) || [])}
- Workout Templates: ${userContextData?.workout_templates || 0} saved
- Uploaded Files: ${userContextData?.uploaded_files?.length || 0} total files

Session Files Context:
${filesContext || 'No files uploaded in this session'}

Instructions:
1. Use all available user data to provide personalized advice
2. Reference specific data points from their history when relevant
3. If files were uploaded, analyze and incorporate their content
4. Extract and store any new profile information mentioned in the conversation
5. Be specific and actionable in your recommendations
6. For nutrition discussions, reference their macro targets and recent intake
7. For workout discussions, consider their recent training and templates`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flashflash-exp",
      systemInstruction: systemPrompt
    });

    // Build conversation history
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Store the message exchange
    await supabaseAdmin
      .from('chat_messages')
      .insert([
        {
          session_id: chatSession.id,
          user_id: user.id,
          role: 'user',
          content: message
        },
        {
          session_id: chatSession.id,
          user_id: user.id,
          role: 'assistant',
          content: response,
          model_used: 'gemini-2.5-flashflash-exp'
        }
      ]);

    // Update session message count
    await supabaseAdmin
      .from('chat_sessions')
      .update({ 
        message_count: (chatSession.message_count || 0) + 2,
        ended_at: new Date().toISOString()
      })
      .eq('id', chatSession.id);

    // Extract profile data from conversation (async, don't wait)
    extractProfileData(user.id, message + ' ' + response, supabaseAdmin);

    return new Response(
      JSON.stringify({ 
        response,
        sessionId: chatSession.id,
        contextUsed: {
          workouts: userContextData?.recent_workouts?.length || 0,
          nutrition: userContextData?.recent_nutrition?.length || 0,
          files: chatSession.uploaded_files?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to extract profile data from conversations
async function extractProfileData(userId: string, text: string, supabase: any) {
  try {
    // Simple keyword extraction - in production, use NLP
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
    const goalMatches = text.match(new RegExp(`(?:${goalKeywords.join('|')})\\s+(?:is\\s+)?(.+?)(?:\\.|,|;|$)`, 'gi'));
    if (goalMatches) {
      extractedData.primary_goal = goalMatches[0].replace(/^.*?(goal|want to|trying to|aim to|objective)\s+(?:is\s+)?/i, '').trim();
    }

    // Training experience
    if (/beginner|new to|just start/i.test(text)) extractedData.training_experience = 'beginner';
    else if (/intermediate|some experience|few years/i.test(text)) extractedData.training_experience = 'intermediate';
    else if (/advanced|experienced|many years/i.test(text)) extractedData.training_experience = 'advanced';

    // Store extracted data if any found
    if (Object.keys(extractedData).length > 0) {
      await supabase.rpc('update_profile_from_chat_data', {
        p_user_id: userId,
        p_extracted_data: extractedData
      });
    }
  } catch (error) {
    console.error('Error extracting profile data:', error);
  }
}