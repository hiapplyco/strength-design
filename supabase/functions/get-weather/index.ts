import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, numberOfDays = 7 } = await req.json();
    console.log('Weather request params:', { query, numberOfDays });

    if (!query) {
      throw new Error('Location query is required');
    }

    // First, get location coordinates
    console.log('Fetching location data for:', query);
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geocodingUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results?.[0]) {
      throw new Error('Location not found');
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    console.log('Location found:', { latitude, longitude, name, country });

    // Fetch detailed weather data including daily forecast
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
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max'
    ].join(','));
    weatherUrl.searchParams.append('timezone', 'auto');
    weatherUrl.searchParams.append('forecast_days', numberOfDays.toString());

    console.log('Fetching weather data from:', weatherUrl.toString());
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      throw new Error('Weather data not available');
    }

    // Transform the data into our WeatherData format
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

    console.log('Transformed weather data:', transformedData);

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch weather data'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});