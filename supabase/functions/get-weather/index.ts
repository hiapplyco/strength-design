import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Start performance measurement
  const startTime = performance.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, latitude, longitude } = await req.json();
    console.log('Weather request params:', { query, latitude, longitude });

    if (query) {
      console.log('Fetching location data for:', query);
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const geoResponse = await fetch(geocodingUrl);
      const geoData = await geoResponse.json();
      
      const endTime = performance.now();
      console.log(`Geocoding completed in ${endTime - startTime}ms`);
      
      return new Response(JSON.stringify(geoData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required for weather data');
    }

    console.log('Fetching weather data for:', { latitude, longitude });
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const endTime = performance.now();
    console.log(`Weather request completed in ${endTime - startTime}ms`);

    return new Response(JSON.stringify({
      weather: weatherData,
      currentDay: currentDate
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-weather function:', error);
    const endTime = performance.now();
    console.error(`Request failed after ${endTime - startTime}ms`);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch weather data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});