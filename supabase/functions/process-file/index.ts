import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from '@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log("Process File Edge Function initialized");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    console.log("Processing new request");

    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get the API key from environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      throw new Error('API key not configured');
    }

    // Initialize Gemini
    console.log("Initializing Gemini API");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log("File received:", file.name, file.type, file.size);

    // Read file content
    const fileContent = await file.text();
    console.log("File content length:", fileContent.length);

    // Process with Gemini
    console.log("Sending to Gemini API");
    const result = await model.generateContent([
      "Extract and summarize the exercise-related information from this text. Focus on any specific exercises, restrictions, or recommendations:",
      fileContent
    ]);
    
    console.log("Received response from Gemini");
    const response = await result.response;
    const text = response.text();
    
    console.log("Processing complete, returning response");
    return new Response(
      JSON.stringify({ text }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})