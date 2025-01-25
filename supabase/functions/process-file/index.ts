import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File size exceeds 20MB limit');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('Processing file with Gemini...', file.type);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = "Extract and summarize the exercise-related information from this document. Focus on any specific exercises, restrictions, or recommendations:";

    // Convert the file data to base64 using spread operator
    const base64Data = btoa(String.fromCharCode(...uint8Array));

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      }
    ]);

    console.log('Received response from Gemini');

    const response = await result.response;
    const text = response.text();

    console.log('Successfully extracted text from file');

    return new Response(
      JSON.stringify({ text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Handle specific error cases
    let status = 500;
    let message = error.message || 'Failed to process file';
    
    if (error.message === 'File size exceeds 20MB limit') {
      status = 413; // Request Entity Too Large
    } else if (error.message.includes('Base64')) {
      status = 400; // Bad Request
      message = 'Failed to encode file data';
    }

    return new Response(
      JSON.stringify({ 
        error: message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status 
      }
    );
  }
});