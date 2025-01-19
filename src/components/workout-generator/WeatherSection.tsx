import { useState } from "react";
import { CloudSun } from "lucide-react";
import { LocationSearch } from "../LocationSearch";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  location: string;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
}

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
}

export function WeatherSection({ weatherData, onWeatherUpdate }: WeatherSectionProps) {
  const getWeatherDescription = (code: number) => {
    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };
    return weatherCodes[code] || "Unknown";
  };

  const handleLocationSelect = async (location: { 
    name: string; 
    latitude: number; 
    longitude: number;
    admin1?: string;
    country: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { 
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      if (error) throw error;

      const locationString = [
        location.name,
        location.admin1,
        location.country
      ].filter(Boolean).join(", ");

      const weatherData = {
        temperature: data.weather.current.temperature_2m,
        humidity: data.weather.current.relative_humidity_2m,
        windSpeed: data.weather.current.wind_speed_10m,
        location: locationString,
        apparentTemperature: data.weather.current.apparent_temperature,
        precipitation: data.weather.current.precipitation,
        weatherCode: data.weather.current.weather_code
      };

      const weatherDesc = getWeatherDescription(data.weather.current.weather_code);
      const weatherPrompt = 
        `Consider these detailed weather conditions: 
        Location: ${locationString}
        Temperature: ${data.weather.current.temperature_2m}°C (${(data.weather.current.temperature_2m * 9/5 + 32).toFixed(1)}°F)
        Feels Like: ${data.weather.current.apparent_temperature}°C (${(data.weather.current.apparent_temperature * 9/5 + 32).toFixed(1)}°F)
        Humidity: ${data.weather.current.relative_humidity_2m}%
        Wind Speed: ${data.weather.current.wind_speed_10m} m/s (${(data.weather.current.wind_speed_10m * 2.237).toFixed(1)} mph)
        Precipitation: ${data.weather.current.precipitation} mm
        Weather Conditions: ${weatherDesc}
        
        Please adjust the workout accordingly, considering factors like:
        - Temperature impact on warm-up duration and intensity
        - Humidity effects on rest periods and hydration needs
        - Wind considerations for outdoor movements
        - Precipitation adaptations if outdoor work is planned
        - Overall safety modifications based on weather conditions`;

      onWeatherUpdate(weatherData, weatherPrompt);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <CloudSun className="h-5 w-5" />
        <h3 className="font-oswald text-lg uppercase">Weather Conditions</h3>
      </div>
      <LocationSearch onLocationSelect={handleLocationSelect} />
      
      {weatherData && (
        <div className="bg-primary/10 rounded-lg p-4 text-sm text-primary animate-fade-in">
          <p className="font-semibold mb-2">{weatherData.location}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="font-semibold">
                {weatherData.temperature}°C
                <br />
                {(weatherData.temperature * 9/5 + 32).toFixed(1)}°F
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Feels Like</p>
              <p className="font-semibold">
                {weatherData.apparentTemperature}°C
                <br />
                {(weatherData.apparentTemperature * 9/5 + 32).toFixed(1)}°F
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="font-semibold">{weatherData.humidity}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wind Speed</p>
              <p className="font-semibold">
                {weatherData.windSpeed} m/s
                <br />
                {(weatherData.windSpeed * 2.237).toFixed(1)} mph
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Precipitation</p>
              <p className="font-semibold">{weatherData.precipitation} mm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conditions</p>
              <p className="font-semibold">{getWeatherDescription(weatherData.weatherCode)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}