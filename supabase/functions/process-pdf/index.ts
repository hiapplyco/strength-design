import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'No file uploaded' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Data,
        mimeType: "application/pdf"
      }
    },
    "Extract and return all text content from this document without any analysis or summary. Just return the raw text content."
  ]);

  const text = result.response.text();

  return new Response(
    JSON.stringify({ text }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});