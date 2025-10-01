import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user ID from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { fileName, fileType, originalName } = await req.json();

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('workout-uploads')
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    let prompt = `You are an expert fitness coach analyzing a workout file. The user has uploaded a ${fileType} file named "${originalName}". `;
    let content: any;

    // Handle different file types
    if (fileType.startsWith('image/')) {
      // Convert image to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      prompt += `Analyze this workout image and extract the following information:
      1. Exercise names and movements
      2. Sets, reps, and weights (if visible)
      3. Rest periods (if mentioned)
      4. Any notes or special instructions
      5. Training style or methodology

      Then, convert this into a structured workout plan with proper formatting. If you can't extract specific details, make reasonable assumptions based on common training practices.`;

      content = [
        { text: prompt },
        { inlineData: { mimeType: fileType, data: base64 } }
      ];
    } else if (fileType === 'text/csv' || fileType === 'text/plain') {
      // Handle text-based files
      const text = await fileData.text();
      prompt += `Here's the content of the file:\n\n${text}\n\n
      Extract and structure this into a proper workout plan including:
      1. Exercise names
      2. Sets and reps
      3. Weights or intensity
      4. Rest periods
      5. Any additional notes
      
      Format it as a clear, actionable workout plan.`;
      
      content = [{ text: prompt }];
    } else if (fileType === 'application/pdf' || fileType.includes('word')) {
      // For PDFs and Word docs, we'll need to inform the user
      prompt += `The user uploaded a ${fileType.includes('pdf') ? 'PDF' : 'Word document'}. 
      Since I cannot directly process this file type in this context, please provide a structured workout plan template 
      that the user can fill in manually. Include sections for:
      1. Workout name and goals
      2. Warm-up routine
      3. Main exercises (with sets, reps, weight)
      4. Cool-down
      5. Notes and progression tips`;
      
      content = [{ text: prompt }];
    }

    // Generate workout analysis
    const result = await model.generateContent(content);
    const response = result.response;
    const workoutAnalysis = response.text();

    // Create a workout entry in the database
    const workoutData = {
      name: `Uploaded: ${originalName}`,
      description: workoutAnalysis.substring(0, 200) + '...',
      exercises: [], // This would need to be parsed from the analysis
      user_id: user.id,
      ai_analysis: workoutAnalysis,
      source_file: fileName,
      created_at: new Date().toISOString()
    };

    const { data: workout, error: insertError } = await supabaseClient
      .from('generated_workouts')
      .insert(workoutData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        workoutId: workout.id,
        analysis: workoutAnalysis 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing workout upload:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});