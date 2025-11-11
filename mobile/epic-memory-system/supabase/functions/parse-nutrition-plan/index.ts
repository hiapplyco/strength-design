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
    const { fileName, fileType } = await req.json();

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('nutrition-uploads')
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flashflash-exp" });

    let prompt = `You are a nutrition expert analyzing a meal plan or nutrition document. Extract the following information from this ${fileType} file:

    1. Daily macro targets:
       - Calories
       - Protein (g)
       - Carbohydrates (g)
       - Fat (g)
       - Fiber (g)
       - Sugar (g)
       - Sodium (mg)
       - Cholesterol (mg)
       - Saturated fat (g)
       - Water intake (ml or oz - convert to ml)

    2. Any additional nutrients mentioned with targets

    3. Meal timing recommendations

    4. Special dietary notes or restrictions

    Return the data in this exact JSON format:
    {
      "macros": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number,
        "sugar": number,
        "sodium": number,
        "cholesterol": number,
        "saturated_fat": number,
        "water_ml": number
      },
      "customTargets": {
        "nutrient_name": { "value": number, "unit": "string" }
      },
      "mealTiming": ["array of timing recommendations"],
      "dietaryNotes": ["array of important notes"],
      "summary": "Brief summary of the nutrition plan"
    }

    If any values are not found, use reasonable defaults based on common nutrition guidelines.`;

    let content: any;

    // Handle different file types
    if (fileType.startsWith('image/')) {
      // Convert image to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      content = [
        { text: prompt },
        { inlineData: { mimeType: fileType, data: base64 } }
      ];
    } else if (fileType === 'text/csv' || fileType === 'text/plain') {
      // Handle text-based files
      const text = await fileData.text();
      prompt += `\n\nHere's the content of the file:\n\n${text}`;
      content = [{ text: prompt }];
    } else if (fileType === 'application/pdf' || fileType.includes('word')) {
      // For PDFs and Word docs, provide template response
      prompt = `The user uploaded a ${fileType.includes('pdf') ? 'PDF' : 'Word document'} nutrition plan. 
      Since I cannot directly process this file type, provide reasonable default macro targets for a balanced diet:`;
      content = [{ text: prompt }];
    }

    // Generate analysis
    const result = await model.generateContent(content);
    const response = result.response;
    const analysisText = response.text();

    // Parse the JSON response
    let parsedData;
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // Return default values if parsing fails
      parsedData = {
        macros: {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 65,
          fiber: 25,
          sugar: 50,
          sodium: 2300,
          cholesterol: 300,
          saturated_fat: 20,
          water_ml: 2000
        },
        summary: "Unable to parse specific values from the document. Default balanced diet targets applied."
      };
    }

    // Store the analysis in the database
    const { error: insertError } = await supabaseClient
      .from('nutrition_plan_analyses')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileType,
        analysis: parsedData,
        raw_analysis: analysisText,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...parsedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing nutrition plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});