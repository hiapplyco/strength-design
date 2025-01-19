import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { lookup } from "https://deno.land/x/geoip@1.0.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get location from IP
    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")
    const geo = ip ? lookup(ip) : null

    if (!geo || !geo.latitude || !geo.longitude) {
      console.error("Could not determine location from ip:", ip)
      throw new Error('Unable to determine location')
    }

    const { latitude, longitude, city } = geo

    // Fetch weather data from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`
    const weatherResponse = await fetch(weatherUrl)

    if (!weatherResponse.ok) {
      console.error('Open-Meteo API error:', await weatherResponse.text())
      throw new Error('Failed to fetch weather data')
    }

    const weatherData = await weatherResponse.json()

    // Get current date and day
    const currentDate = new Date()
    const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' })

    const responseData = {
      city,
      weather: weatherData.current,
      day: currentDay,
    }

    console.log('Weather data retrieved successfully:', responseData)
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error('Error in weather edge function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})