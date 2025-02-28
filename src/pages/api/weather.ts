
import type { NextApiRequest, NextApiResponse } from 'next';
import type { WeatherData } from '@/types/weather';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { lat, lon } = req.query;
  
  if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.append('latitude', lat);
    weatherUrl.searchParams.append('longitude', lon);
    weatherUrl.searchParams.append('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day'
    ].join(','));
    weatherUrl.searchParams.append('daily', [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max'
    ].join(','));
    weatherUrl.searchParams.append('timezone', 'auto');
    weatherUrl.searchParams.append('forecast_days', '7');

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.current) {
      throw new Error('Weather data not available');
    }

    const weatherData: WeatherData = {
      location: req.query.name as string || 'Location',
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      apparentTemperature: data.current.apparent_temperature,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      isDay: data.current.is_day === 1,
      forecast: data.daily ? {
        dates: data.daily.time,
        weatherCodes: data.daily.weather_code,
        maxTemps: data.daily.temperature_2m_max,
        minTemps: data.daily.temperature_2m_min,
        precipitationProb: data.daily.precipitation_probability_max,
        maxWindSpeed: data.daily.wind_speed_10m_max
      } : null
    };
    
    return res.status(200).json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
