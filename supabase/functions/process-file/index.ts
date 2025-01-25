import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB limit
const ALLOWED_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/heic', 
  'image/heif',
  'application/pdf'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'File too large',
          message: 'Files must be less than 4MB',
          size: file.size,
          maxSize: MAX_FILE_SIZE
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 413 // Payload Too Large
        }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file type',
          message: 'Only JPEG, PNG, WEBP, HEIC, HEIF and PDF files are supported',
          type: file.type,
          allowedTypes: ALLOWED_TYPES
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 415 // Unsupported Media Type
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Data = btoa(String.fromCharCode(...uint8Array));
    
    console.log('Processing file with Gemini...');

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = "Extract and summarize the exercise-related information from this document. Focus on any specific exercises, restrictions, or recommendations:";

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
    
    // Handle different types of errors
    if (error.message?.includes('Base64')) {
      return new Response(
        JSON.stringify({ 
          error: 'File encoding error',
          message: 'Failed to process file data',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Handle Gemini API specific errors
    if (error.message?.includes('Gemini')) {
      return new Response(
        JSON.stringify({ 
          error: 'AI processing error',
          message: 'Failed to process image with AI',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});