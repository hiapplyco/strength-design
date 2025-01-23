import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) throw new Error('No file uploaded');

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    console.log('Initialized Gemini API');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log('Model initialized');

    const result = await model.generateContent({
      contents: [{
        parts: [{
          inlineData: {
            data: base64Data,
            mimeType: "application/pdf"
          }
        }, {
          text: "Extract and return all text content from this document."
        }]
      }]
    });

    return new Response(
      JSON.stringify({ text: result.response.text() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PDF processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});