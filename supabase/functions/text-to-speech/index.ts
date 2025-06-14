
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration constants with fallback to default voice
const DEFAULT_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ";
const DEFAULT_MODEL = "eleven_multilingual_v2";
const CHUNK_SIZE = 32768;

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Process ArrayBuffer to base64 in chunks to prevent memory issues
 */
function bufferToBase64(buffer: ArrayBuffer, chunkSize = CHUNK_SIZE): string {
  const uint8Array = new Uint8Array(buffer);
  let result = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    result += String.fromCharCode.apply(null, chunk);
  }
  
  return btoa(result);
}

/**
 * Create a JSON response with appropriate headers
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { 
        ...CORS_HEADERS, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

/**
 * The main handler function for the edge function
 */
async function handleTtsRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  
  try {
    // Extract and validate request data
    const { text, voice_id, model_id } = await req.json();
    console.log('Received TTS request:', { text_length: text?.length, voice_id, model_id });
    
    if (!text?.trim()) {
      return jsonResponse({ error: 'Text is required' }, 400);
    }
    
    // Get API key from environment
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'ElevenLabs API key not configured' }, 500);
    }
    
    // Use provided voice_id or fall back to default
    const voiceId = voice_id || DEFAULT_VOICE_ID;
    const modelId = model_id || DEFAULT_MODEL;
    
    // Build the API endpoint URL
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    // Configure voice settings and request payload
    const ttsPayload = {
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    };
    
    // Make request to ElevenLabs API
    console.log('Making request to ElevenLabs API with voice:', voiceId);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(ttsPayload)
    });
    
    // Handle API errors with more detailed error reporting
    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      
      // Try to parse error for better user feedback
      let errorMessage = 'Failed to generate speech';
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
      } catch {
        // If parsing fails, use the raw error
        errorMessage = errorData || errorMessage;
      }
      
      return jsonResponse({ 
        error: errorMessage,
        voice_id: voiceId,
        status: response.status
      }, response.status);
    }
    
    // Process successful response
    console.log('Successfully received audio response from ElevenLabs');
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = bufferToBase64(audioBuffer);
    
    return jsonResponse({ 
      audioContent: base64Audio,
      voice_id: voiceId,
      model_id: modelId
    });
    
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return jsonResponse({ 
      error: error.message || 'Unknown error occurred'
    }, 500);
  }
}

// Start the server
serve(handleTtsRequest);
