import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@1.0.0?target=deno";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'audio/mpeg'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, fileUrl } = await req.json();
    console.log('Processing chat request:', { message, fileUrl });

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    let response;
    if (fileUrl) {
      // If there's a file URL, we need to fetch it first
      console.log('Fetching file from URL:', fileUrl);
      const fileResponse = await fetch(fileUrl);
      const fileData = await fileResponse.arrayBuffer();
      const uint8Array = new Uint8Array(fileData);
      const base64Data = btoa(String.fromCharCode(...uint8Array));
      const mimeType = fileResponse.headers.get('content-type') || 'application/pdf';

      if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      console.log('Processing file input with MIME type:', mimeType);
      
      // For image files
      if (mimeType.startsWith('image/')) {
        const result = await model.generateContent({
          contents: [{
            role: "user",
            parts: [
              { 
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              { text: message }
            ]
          }]
        });
        response = await result.response;
      } else {
        // For non-image files, just process the message
        console.log('Non-image file detected, processing message only');
        const result = await model.generateContent({
          contents: [{
            role: "user",
            parts: [{ text: `This is regarding a file of type ${mimeType}. ${message}` }]
          }]
        });
        response = await result.response;
      }
    } else {
      console.log('Processing text-only input');
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: message }]
        }]
      });
      response = await result.response;
    }

    const responseText = response.text();
    console.log('Generated response:', responseText);

    return new Response(
      JSON.stringify({ response: responseText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.status,
      requestDetails: {
        model: "gemini-2.0-flash-001",
        inputType: error.fileUrl ? "multimodal" : "text"
      }
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});