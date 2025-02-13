
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, fileUrl, messageId } = await req.json();
    console.log('Received message:', message);
    console.log('File URL:', fileUrl);
    console.log('Message ID:', messageId);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    let response;

    if (fileUrl) {
      console.log('Processing file from URL:', fileUrl);
      
      // Fetch the file content from Supabase storage URL
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file from storage');
      }

      const fileData = await fileResponse.blob();
      const fileType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      
      // Convert blob to base64
      const buffer = await fileData.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      console.log('Sending file to Gemini for analysis...');
      
      // Send file to Gemini for analysis
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: fileType,
            data: base64Data
          }
        },
        "Please analyze this document and provide a summary of its key points and important information. Focus on any training or gym-related content if present."
      ]);

      response = await result.response;
      console.log('Gemini analysis response:', response.text());
    } else {
      // Fetch document content for context
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('content')
        .eq('id', '3cc372b7-3863-455e-9a88-df22a54ad69b')
        .single();

      if (docError) {
        throw new Error(`Failed to fetch document: ${docError.message}`);
      }

      if (!document?.content) {
        throw new Error('Document content not found');
      }

      console.log('Generating response with document context...');
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You will be analyzing the following CrossFit Affiliate Playbook. Use this content for any questions I ask:" + document.content }],
          },
          {
            role: "model",
            parts: [{ text: "I understand and will use the provided CrossFit Affiliate Playbook content to answer your questions." }],
          }
        ]
      });

      const result = await chat.sendMessage(message);
      response = await result.response;
    }

    const responseText = response.text();
    console.log('Generated response:', responseText);

    // Update the message with the response using service role client
    if (messageId) {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: responseText })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error updating message:', updateError);
        throw updateError;
      }
      console.log('Successfully updated message with response');
    }

    return new Response(
      JSON.stringify({ response: responseText }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      },
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    );
  }
});
