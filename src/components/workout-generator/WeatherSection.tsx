import { useState } from "react";
import { CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  renderTooltip: () => React.ReactNode;
}

export function WeatherSection({ weatherData, onWeatherUpdate, renderTooltip }: WeatherSectionProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGetWeather = async () => {
    if (!location.trim()) return;

    setIsLoading(true);
    try {
      // First get location coordinates
      const { data: locationData, error: locationError } = await supabase.functions.invoke('get-weather', {
        body: { query: location }
      });

      if (locationError) throw locationError;
      if (!locationData.results?.[0]) throw new Error('Location not found');

      const firstResult = locationData.results[0];
      const locationString = [
        firstResult.name,
        firstResult.admin1,
        firstResult.country
      ].filter(Boolean).join(", ");

      // Then get weather data
      const { data: weatherResponse, error: weatherError } = await supabase.functions.invoke('get-weather', {
        body: { 
          latitude: firstResult.latitude,
          longitude: firstResult.longitude
        }
      });

      if (weatherError) throw weatherError;

      const weatherData = {
        temperature: weatherResponse.weather.current.temperature_2m,
        humidity: weatherResponse.weather.current.relative_humidity_2m,
        windSpeed: weatherResponse.weather.current.wind_speed_10m,
        location: locationString,
        apparentTemperature: weatherResponse.weather.current.apparent_temperature,
        precipitation: weatherResponse.weather.current.precipitation,
        weatherCode: weatherResponse.weather.current.weather_code
      };

      const weatherDesc = getWeatherDescription(weatherResponse.weather.current.weather_code);
      const weatherPrompt = 
        `Consider these detailed weather conditions: 
        Location: ${locationString}
        Temperature: ${weatherResponse.weather.current.temperature_2m}°C (${(weatherResponse.weather.current.temperature_2m * 9/5 + 32).toFixed(1)}°F)
        Feels Like: ${weatherResponse.weather.current.apparent_temperature}°C (${(weatherResponse.weather.current.apparent_temperature * 9/5 + 32).toFixed(1)}°F)
        Humidity: ${weatherResponse.weather.current.relative_humidity_2m}%
        Wind Speed: ${weatherResponse.weather.current.wind_speed_10m} m/s (${(weatherResponse.weather.current.wind_speed_10m * 2.237).toFixed(1)} mph)
        Precipitation: ${weatherResponse.weather.current.precipitation} mm
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <CloudSun className="h-5 w-5" />
        <h3 className="font-oswald text-lg uppercase">Weather Conditions</h3>
        {renderTooltip()}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Enter location (e.g., New York, London)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGetWeather()}
          className="flex-1 bg-white text-black placeholder:text-gray-500"
        />
        <Button 
          onClick={handleGetWeather}
          disabled={isLoading}
          className="bg-primary text-white"
        >
          {isLoading ? "Loading..." : "Get Weather"}
        </Button>
      </div>
      
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