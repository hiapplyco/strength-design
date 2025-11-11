
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai@0.12.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, history = [], fileUrl, systemPrompt } = await req.json();
        console.log('Processing message:', message, 'with file:', fileUrl);

        const userMessageParts: any[] = [{ text: message }];

        if (fileUrl) {
            console.log('File URL provided:', fileUrl);
            const url = new URL(fileUrl);
            const filePathWithBucket = url.pathname.substring(url.pathname.indexOf('/chat_uploads/'));
            const filePath = filePathWithBucket.replace('/chat_uploads/', '');
            
            console.log('Downloading file from path:', filePath);

            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from('chat_uploads')
                .download(filePath);

            if (downloadError) {
                console.error('Error downloading file:', downloadError);
                throw new Error(`Failed to download file from storage: ${downloadError.message}`);
            }

            const fileBuffer = await fileData.arrayBuffer();
            const GeminiFilePart = {
              inlineData: {
                data: btoa(String.fromCharCode(...new Uint8Array(fileBuffer))),
                mimeType: fileData.type,
              },
            };
            userMessageParts.unshift(GeminiFilePart);
        }
        
        const contents = [
            ...history,
            { role: "user", parts: userMessageParts }
        ];

        const generationConfig = {
            maxOutputTokens: 8192,
            temperature: 0.7,
        };

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];
        
        const defaultSystemPrompt = "You are a world-class expert in fitness and nutrition. Provide helpful, accurate, and safe advice. Be encouraging and clear. When analyzing a document, summarize it and ask the user what they want to do next.";

        const result = await model.generateContent({
            contents: contents,
            generationConfig: generationConfig,
            safetySettings: safetySettings,
            systemInstruction: systemPrompt || defaultSystemPrompt,
        });

        const response = result.response;
        const text = response.text();
        console.log('Generated response:', text);

        return new Response(
            JSON.stringify({ response: text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('Error in chat-with-gemini function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
});
