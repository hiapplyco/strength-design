import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, fileUrl } = await req.json();
    console.log('Processing chat request:', { message, fileUrl });

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    let response;
    if (fileUrl) {
      // If there's a file URL, we need to fetch it first
      const fileResponse = await fetch(fileUrl);
      const fileData = await fileResponse.arrayBuffer();
      const uint8Array = new Uint8Array(fileData);
      const base64Data = btoa(String.fromCharCode(...uint8Array));

      console.log('Processing file input');
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/octet-stream",
            data: base64Data
          }
        },
        message
      ]);
      response = await result.response;
    } else {
      console.log('Processing text-only input');
      const result = await model.generateContent(message);
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
    console.error('Error in chat-with-gemini function:', error);
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