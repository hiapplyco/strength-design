import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration constants
const ELEVENLABS_API_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ";
const ELEVENLABS_MODEL = "eleven_monolingual_v1";
const CHUNK_SIZE = 32768; // 32KB chunks for base64 processing

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Process ArrayBuffer to base64 in chunks to prevent memory issues
 * @param buffer - The audio ArrayBuffer to convert
 * @param chunkSize - Size of chunks to process at once
 * @returns Base64 encoded string
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
 * @param data - The data to send
 * @param status - HTTP status code
 * @returns Response object
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
 * @param req - The incoming request
 * @returns Response with audio data or error
 */
async function handleTtsRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  
  try {
    // Extract and validate text from request
    const { text } = await req.json();
    console.log('Received text for speech synthesis:', text);
    
    if (!text?.trim()) {
      return jsonResponse({ error: 'Text is required' }, 400);
    }
    
    // Get API key from environment
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'ElevenLabs API key not configured' }, 500);
    }
    
    // Configure voice settings
    const ttsPayload = {
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };
    
    // Make request to ElevenLabs API
    console.log('Making request to ElevenLabs API...');
    const response = await fetch(ELEVENLABS_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(ttsPayload)
    });
    
    // Handle API errors
    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      return jsonResponse({ 
        error: 'Failed to generate speech', 
        details: errorData
      }, response.status);
    }
    
    // Process successful response
    console.log('Successfully received audio response from ElevenLabs');
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = bufferToBase64(audioBuffer);
    
    return jsonResponse({ audioContent: base64Audio });
    
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return jsonResponse({ 
      error: error.message || 'Unknown error occurred'
    }, 500);
  }
}

// Start the server
serve(handleTtsRequest);
