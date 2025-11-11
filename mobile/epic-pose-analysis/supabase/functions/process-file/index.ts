
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log('Processing file request received');
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('File converted to base64, processing with Gemini...');

    // Initialize Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flashflash" });

    // Use different prompts based on file type
    let prompt = "Extract all text content from this document without any analysis.";
    
    if (file.type.includes('pdf')) {
      prompt = "Extract all text content from this PDF without any analysis.";
    } else if (file.type.includes('image')) {
      prompt = "Analyze this image and describe any text or exercises shown in it in detail.";
    } else if (file.type.includes('docx') || file.type.includes('doc')) {
      prompt = "Extract all text content from this Word document without any analysis.";
    }

    console.log(`Using prompt for ${file.type}: ${prompt}`);

    const mimeType = file.type || "application/octet-stream";
    
    // Generate content with Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      prompt
    ]);

    console.log('Received response from Gemini');

    const response = await result.response;
    const text = response.text();

    console.log('Successfully extracted text, length:', text.length);

    return new Response(
      JSON.stringify({ 
        text,
        success: true,
        fileName: file.name,
        fileType: file.type 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process file',
        details: error.stack,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
