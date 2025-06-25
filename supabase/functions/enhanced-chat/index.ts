
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai@0.12.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, history = [], fileUrl, userId, workoutContext, hasWorkoutTemplates } = await req.json();
        console.log('Enhanced chat processing message for user:', userId);

        let userContext = '';
        
        // Fetch comprehensive user data if userId is provided
        if (userId) {
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            
            // Fetch workout sessions with generated workouts
            const { data: workoutSessions } = await supabaseAdmin
                .from('workout_sessions')
                .select(`
                    *,
                    generated_workouts (title, summary, workout_data),
                    workout_metrics (*)
                `)
                .eq('user_id', userId)
                .gte('created_at', twoWeeksAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);

            // Fetch generated workout templates
            const { data: workoutTemplates } = await supabaseAdmin
                .from('generated_workouts')
                .select('*')
                .eq('user_id', userId)
                .order('generated_at', { ascending: false })
                .limit(10);

            // Fetch nutrition logs
            const { data: nutritionLogs } = await supabaseAdmin
                .from('nutrition_logs')
                .select(`
                    *,
                    meal_entries (
                        *,
                        food_items (*)
                    ),
                    exercise_entries (*)
                `)
                .eq('user_id', userId)
                .gte('date', twoWeeksAgo.toISOString().split('T')[0])
                .order('date', { ascending: false })
                .limit(7);

            // Fetch journal entries
            const { data: journalEntries } = await supabaseAdmin
                .from('journal_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('date', twoWeeksAgo.toISOString().split('T')[0])
                .order('date', { ascending: false })
                .limit(7);

            // Fetch nutrition targets
            const { data: nutritionTargets } = await supabaseAdmin
                .from('nutrition_targets')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Generate comprehensive context summary
            if (workoutSessions || nutritionLogs || journalEntries || workoutTemplates) {
                const weeklyWorkouts = workoutSessions?.filter(session => {
                    const sessionDate = new Date(session.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate >= weekAgo;
                }).length || 0;

                const avgCalories = nutritionLogs?.reduce((sum, log) => {
                    const totalCals = log.meal_entries?.reduce((mealSum, entry) => 
                        mealSum + (entry.food_items?.calories_per_serving * entry.serving_multiplier || 0), 0) || 0;
                    return sum + totalCals;
                }, 0) / Math.max(nutritionLogs?.length || 1, 1);

                const avgMood = journalEntries?.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / Math.max(journalEntries?.length || 1, 1);

                userContext = `
USER FITNESS PROFILE CONTEXT:
=============================

CURRENT WEEK ACTIVITY:
- Workouts completed this week: ${weeklyWorkouts}
- Generated workout templates available: ${workoutTemplates?.length || 0}
- Average daily calories: ${Math.round(avgCalories || 0)} kcal
- Target daily calories: ${nutritionTargets?.daily_calories || 'Not set'}
- Average mood rating: ${Math.round((avgMood || 0) * 10) / 10}/10

WORKOUT TEMPLATES & HISTORY:
${workoutTemplates?.slice(0, 5).map(template => `
- "${template.title || 'Untitled Workout'}" (${new Date(template.generated_at).toLocaleDateString()})
  Summary: ${template.summary || 'Custom workout plan'}
  Target Groups: ${template.target_muscle_groups?.join(', ') || 'Not specified'}
  Equipment: ${template.equipment_needed?.join(', ') || 'Not specified'}
`).join('') || 'No workout templates generated yet'}

RECENT WORKOUT SESSIONS:
${workoutSessions?.slice(0, 3).map(session => `
- ${new Date(session.created_at).toLocaleDateString()}: ${session.status} workout
  Title: ${session.generated_workouts?.title || 'Custom workout'}
  Satisfaction: ${session.satisfaction_rating || 'Not rated'}/10
  Duration: ${session.actual_duration_minutes || 'Not tracked'} minutes
  Notes: ${session.notes || 'No notes'}
`).join('') || 'No recent workout sessions'}

RECENT NUTRITION DATA:
${nutritionLogs?.slice(0, 5).map(log => {
    const totalCals = log.meal_entries?.reduce((sum, entry) => 
        sum + (entry.food_items?.calories_per_serving * entry.serving_multiplier || 0), 0) || 0;
    const totalProtein = log.meal_entries?.reduce((sum, entry) => 
        sum + (entry.food_items?.protein_per_serving * entry.serving_multiplier || 0), 0) || 0;
    const exerciseCalories = log.exercise_entries?.reduce((sum, entry) => sum + entry.calories_burned, 0) || 0;
    return `- ${log.date}: ${Math.round(totalCals)} kcal, ${Math.round(totalProtein * 10) / 10}g protein${exerciseCalories > 0 ? `, ${exerciseCalories} cal burned` : ''}`;
}).join('\n') || 'No recent nutrition data'}

WELLNESS TRENDS:
${journalEntries?.slice(0, 3).map(entry => `
- ${entry.date}: Mood ${entry.mood_rating || 'N/A'}/10, Energy ${entry.energy_level || 'N/A'}/10, Sleep ${entry.sleep_quality || 'N/A'}/10
  ${entry.content ? `Notes: ${entry.content.substring(0, 100)}...` : ''}
`).join('') || 'No recent wellness data'}

${workoutContext || ''}

COACHING GUIDELINES:
- Provide personalized advice based on this actual data and workout templates
- Reference specific patterns, workouts, and trends you observe
- Be encouraging about progress and realistic about improvements
- Suggest actionable next steps based on their current performance and available workout templates
- Help them understand how to use their generated workouts effectively
- Connect nutrition and exercise data to provide holistic coaching
- Always relate advice to their actual fitness journey and available resources
`;
            }
        }

        const userMessageParts: any[] = [{ text: message }];

        if (fileUrl) {
            console.log('Processing file:', fileUrl);
            const url = new URL(fileUrl);
            const filePathWithBucket = url.pathname.substring(url.pathname.indexOf('/chat_uploads/'));
            const filePath = filePathWithBucket.replace('/chat_uploads/', '');
            
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from('chat_uploads')
                .download(filePath);

            if (downloadError) {
                console.error('Error downloading file:', downloadError);
                throw new Error(`Failed to download file: ${downloadError.message}`);
            }

            const fileBuffer = await fileData.arrayBuffer();
            const GeminiFilePart = {
              inlineData: {
                data: btoa(String.fromCharCode(...new Uint8Array(fileBuffer))),
                mimeType: fileData.type,
              },
            };
            userMessageParts.unshift(GeminiFilePart);
        }
        
        const contents = [
            ...history,
            { role: "user", parts: userMessageParts }
        ];

        const generationConfig = {
            maxOutputTokens: 8192,
            temperature: 0.7,
        };

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];
        
        const enhancedSystemPrompt = `You are a world-class personal fitness and nutrition coach with access to the user's complete fitness data, including their generated workout templates, nutrition logs, and wellness patterns. You provide personalized, data-driven advice based on their actual performance and available resources.

${userContext}

COACHING APPROACH:
- Always reference specific data points when giving advice
- Help users understand and utilize their generated workout templates effectively
- Identify patterns and trends in their behavior across workouts, nutrition, and wellness
- Provide actionable, specific recommendations based on their actual data and workout library
- Be encouraging about progress while being realistic about areas for improvement
- Connect all advice to their actual fitness journey, available workout templates, and tracked data
- Suggest specific workouts from their templates or modifications based on their performance data
- Help integrate their workout routines with their nutrition tracking for optimal results
- Ask follow-up questions to better understand their goals and challenges
- When they mention specific workouts or exercises, reference their workout templates if applicable

WORKOUT TEMPLATE INTEGRATION:
- Help users choose appropriate workouts from their generated templates
- Suggest modifications to existing templates based on their performance data
- Explain how their workout templates align with their goals and current fitness level
- Reference specific exercises or routines from their workout library when relevant

When analyzing documents or files, extract relevant fitness/nutrition information and relate it to their current data, patterns, and available workout templates.`;

        const result = await model.generateContent({
            contents: contents,
            generationConfig: generationConfig,
            safetySettings: safetySettings,
            systemInstruction: enhancedSystemPrompt,
        });

        const response = result.response;
        const text = response.text();
        console.log('Generated enhanced response with comprehensive user context');

        // Update the message in the database with the response
        if (userId) {
            const { error: updateError } = await supabaseAdmin
                .from('chat_messages')
                .update({ response: text })
                .eq('user_id', userId)
                .eq('message', message)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (updateError) {
                console.error('Error updating message with response:', updateError);
            }
        }

        return new Response(
            JSON.stringify({ response: text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('Error in enhanced-chat function:', error);
        return new Response(
            JSON.stringify({ 
                error: error.message,
                response: "I'm experiencing technical difficulties right now. Please try again in a moment, and I'll be happy to help with your fitness and nutrition questions!"
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
});
