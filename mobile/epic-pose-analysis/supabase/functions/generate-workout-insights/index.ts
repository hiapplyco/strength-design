
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, dateRange } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch workout sessions with generated workouts
    const { data: workoutSessions, error: workoutError } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        generated_workouts:generated_workout_id(*)
      `)
      .eq('user_id', userId)
      .gte('scheduled_date', dateRange.start)
      .lte('scheduled_date', dateRange.end)
      .order('scheduled_date', { ascending: true });

    if (workoutError) throw workoutError;

    // Fetch journal entries
    const { data: journalEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true });

    if (journalError) throw journalError;

    // Prepare data for Gemini analysis
    const analysisData = {
      workoutSessions: workoutSessions.map(session => ({
        date: session.scheduled_date,
        status: session.status,
        title: session.generated_workouts?.title,
        workoutData: session.generated_workouts?.workout_data,
        satisfaction_rating: session.satisfaction_rating,
        perceived_exertion: session.perceived_exertion,
        actual_duration_minutes: session.actual_duration_minutes,
        notes: session.notes
      })),
      journalEntries: journalEntries.map(entry => ({
        date: entry.date,
        mood_rating: entry.mood_rating,
        energy_level: entry.energy_level,
        sleep_quality: entry.sleep_quality,
        stress_level: entry.stress_level,
        title: entry.title,
        content: entry.content
      }))
    };

    // Create prompt for Gemini
    const prompt = `
    Analyze the following fitness and wellness data and provide comprehensive insights:

    WORKOUT DATA:
    ${JSON.stringify(analysisData.workoutSessions, null, 2)}

    JOURNAL DATA:
    ${JSON.stringify(analysisData.journalEntries, null, 2)}

    Please provide insights in the following JSON format:
    {
      "overallSummary": "Brief overview of the user's fitness journey",
      "workoutInsights": {
        "completionRate": number,
        "consistencyScore": number,
        "trendAnalysis": "Description of workout trends",
        "recommendations": ["Array of specific recommendations"]
      },
      "wellnessInsights": {
        "averageMood": number,
        "averageEnergy": number,
        "averageSleep": number,
        "averageStress": number,
        "correlations": "How mood/energy correlates with workouts"
      },
      "visualizations": [
        {
          "type": "line|bar|doughnut",
          "title": "Chart title",
          "data": {
            "labels": ["Array of labels"],
            "datasets": [{
              "label": "Dataset label",
              "data": [array of numbers],
              "backgroundColor": "color or array of colors",
              "borderColor": "color"
            }]
          }
        }
      ],
      "actionableRecommendations": [
        {
          "category": "workout|nutrition|recovery|motivation",
          "priority": "high|medium|low",
          "recommendation": "Specific actionable advice",
          "reasoning": "Why this recommendation is important"
        }
      ]
    }

    Focus on providing data-driven insights and practical recommendations for improving fitness consistency and overall wellness.
    `;

    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flashflash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let insights;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedText;
      insights = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback response structure
      insights = {
        overallSummary: "Analysis completed but response format needs adjustment",
        workoutInsights: {
          completionRate: 0,
          consistencyScore: 0,
          trendAnalysis: "Unable to parse detailed analysis",
          recommendations: ["Continue tracking your workouts for better insights"]
        },
        wellnessInsights: {
          averageMood: 5,
          averageEnergy: 5,
          averageSleep: 5,
          averageStress: 5,
          correlations: "More data needed for correlation analysis"
        },
        visualizations: [],
        actionableRecommendations: []
      };
    }

    // Store insights in database
    const { data: savedInsight, error: saveError } = await supabase
      .from('ai_insights')
      .insert({
        user_id: userId,
        insight_type: 'workout_analysis',
        title: 'Fitness & Wellness Insights',
        content: insights.overallSummary,
        metadata: insights,
        confidence_score: 0.85
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving insights:', saveError);
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-workout-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      overallSummary: "Unable to generate insights at this time. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
