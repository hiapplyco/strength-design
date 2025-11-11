import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for weather data with 5-minute expiration
const weatherCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Add allowed methods
      }
    });
  }

  // Verify request method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Add request body parsing error handling
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { query, numberOfDays = 7 } = body;
    console.log('Weather request params:', { query, numberOfDays });

    if (!query) {
      return new Response(JSON.stringify({ error: 'Location query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache first
    const cacheKey = `${query}-${numberOfDays}`;
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
      const { data, timestamp } = cachedData;
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('Returning cached weather data for:', query);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      weatherCache.delete(cacheKey);
    }

    // Fetch location data with proper error handling
    console.log('Fetching location data for:', query);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.log('Geocoding request timed out');
    }, 5000);

    try {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const geoResponse = await fetch(geocodingUrl, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      if (!geoResponse.ok) {
        throw new Error(`Geocoding API error: ${geoResponse.status}`);
      }

      const geoData = await geoResponse.json();
      if (!geoData.results?.[0]) {
        return new Response(JSON.stringify({ error: 'Location not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      console.log('Location found:', { latitude, longitude, name, country });

      // Fetch weather data with a separate timeout
      const weatherController = new AbortController();
      const weatherTimeout = setTimeout(() => {
        weatherController.abort();
        console.log('Weather request timed out');
      }, 5000);

      try {
        const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
        weatherUrl.searchParams.append('latitude', latitude.toString());
        weatherUrl.searchParams.append('longitude', longitude.toString());
        weatherUrl.searchParams.append('current', [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
          'wind_gusts_10m'
        ].join(','));
        weatherUrl.searchParams.append('daily', [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
          'wind_speed_10m_max'
        ].join(','));
        weatherUrl.searchParams.append('timezone', 'auto');
        weatherUrl.searchParams.append('forecast_days', numberOfDays.toString());

        console.log('Fetching weather data from:', weatherUrl.toString());
        const weatherResponse = await fetch(weatherUrl, {
          signal: weatherController.signal,
          headers: { 'Accept': 'application/json' }
        });

        if (!weatherResponse.ok) {
          throw new Error(`Weather API error: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        if (!weatherData.current) {
          throw new Error('Weather data not available');
        }

        const transformedData = {
          location: `${name}, ${country}`,
          temperature: weatherData.current.temperature_2m,
          humidity: weatherData.current.relative_humidity_2m,
          windSpeed: weatherData.current.wind_speed_10m,
          apparentTemperature: weatherData.current.apparent_temperature,
          precipitation: weatherData.current.precipitation,
          weatherCode: weatherData.current.weather_code,
          windDirection: weatherData.current.wind_direction_10m,
          windGusts: weatherData.current.wind_gusts_10m,
          forecast: weatherData.daily ? {
            dates: weatherData.daily.time,
            weatherCodes: weatherData.daily.weather_code,
            maxTemps: weatherData.daily.temperature_2m_max,
            minTemps: weatherData.daily.temperature_2m_min,
            precipitationProb: weatherData.daily.precipitation_probability_max,
            maxWindSpeed: weatherData.daily.wind_speed_10m_max
          } : null
        };

        // Cache the result
        weatherCache.set(cacheKey, {
          data: transformedData,
          timestamp: Date.now()
        });

        console.log('Weather data processed successfully');
        return new Response(JSON.stringify(transformedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } finally {
        clearTimeout(weatherTimeout);
      }

    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    console.error('Error in get-weather function:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: 'Request timed out',
        details: 'The request took too long to complete'
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch weather data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});