
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!audioFile || !name) {
      return new Response(
        JSON.stringify({ error: 'Audio file and name are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Create voice cloning request
    const cloneFormData = new FormData();
    cloneFormData.append('name', name);
    if (description) {
      cloneFormData.append('description', description);
    }
    cloneFormData.append('files', audioFile);

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: cloneFormData
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs voice cloning error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to clone voice', details: errorData }),
        { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ voice_id: result.voice_id }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in clone-voice function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
