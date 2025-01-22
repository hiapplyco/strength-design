import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWeatherDescription } from "./weather-utils";

interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: any | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function WeatherSearch({ onWeatherUpdate, renderTooltip }: WeatherSearchProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast({
        title: "Error",
        description: "Please enter a location",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // First, get coordinates using the Geocoding API
      const geocodingResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      
      if (!geocodingResponse.ok) {
        throw new Error("Failed to find location");
      }

      const geocodingData = await geocodingResponse.json();
      
      if (!geocodingData.results?.[0]) {
        throw new Error("Location not found");
      }

      const { latitude, longitude, name, country } = geocodingData.results[0];
      
      // Then, get weather data using the Weather API
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weatherData = await weatherResponse.json();
      
      if (!weatherData.current) {
        throw new Error("Weather data not available");
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

      const weatherDescription = getWeatherDescription(weatherData.current.weather_code);
      onWeatherUpdate(
        transformedData, 
        `The weather in ${name}, ${country} is ${weatherDescription} with a temperature of ${weatherData.current.temperature_2m}°C.`
      );
      
      toast({
        title: "Success",
        description: `Weather data loaded for ${name}, ${country}`,
      });

    } catch (err) {
      console.error("Error fetching weather:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch weather data";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      onWeatherUpdate(null, "");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Add Your Location</h3>
        {renderTooltip()}
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter city name..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </form>
    </div>
  );
}