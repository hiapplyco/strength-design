import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { WeatherData } from "@/types/weather";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

const getWeatherDescription = (code: number): string => {
  const weatherCodes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return weatherCodes[code] || 'Unknown';
};

export function WeatherSection({ weatherData, onWeatherUpdate, renderTooltip }: WeatherSectionProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationSearch = async () => {
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching weather data for:", location);
      const { data, error: apiError } = await supabase.functions.invoke("get-weather", {
        body: { query: location },
      });

      if (apiError) {
        console.error("Error fetching weather data:", apiError);
        setError("Failed to fetch weather data. Please try again.");
        return;
      }

      if (!data) {
        setError("No weather data found for this location");
        return;
      }

      console.log("Weather data received:", data);
      const weatherDescription = getWeatherDescription(data.weatherCode);
      onWeatherUpdate(data, `The weather in ${data.location} is ${weatherDescription} with a temperature of ${data.temperature}°C.`);
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTemp = (temp: number | undefined) => {
    return temp !== undefined ? `${temp}°C` : 'N/A';
  };

  const formatValue = (value: number | undefined, unit: string) => {
    return value !== undefined ? `${value}${unit}` : 'N/A';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Add Your Location</h3>
        {renderTooltip()}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Enter your location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
        />
        <Button 
          onClick={handleLocationSearch} 
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Get Weather"
          )}
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}

      {weatherData && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-lg mb-3">Current Weather in {weatherData.location}</h4>
              <div className="space-y-2">
                <p>Temperature: {formatTemp(weatherData.temperature)}</p>
                <p>Feels like: {formatTemp(weatherData.apparentTemperature)}</p>
                <p>Humidity: {formatValue(weatherData.humidity, '%')}</p>
                <p>Wind Speed: {formatValue(weatherData.windSpeed, ' km/h')}</p>
                <p>Wind Direction: {formatValue(weatherData.windDirection, '°')}</p>
                <p>Wind Gusts: {formatValue(weatherData.windGusts, ' km/h')}</p>
                <p>Conditions: {getWeatherDescription(weatherData.weatherCode)}</p>
              </div>
            </div>

            {weatherData.forecast && weatherData.forecast.dates.length > 0 && (
              <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-lg mb-3">Forecast</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {weatherData.forecast.dates.map((date, index) => (
                    <div key={date} className="p-3 bg-background/80 rounded-md">
                      <p className="font-medium">{new Date(date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}</p>
                      <div className="mt-1 space-y-1 text-sm">
                        <p>High: {formatTemp(weatherData.forecast!.maxTemps[index])}</p>
                        <p>Low: {formatTemp(weatherData.forecast!.minTemps[index])}</p>
                        <p>Precipitation: {formatValue(weatherData.forecast!.precipitationProb[index], '%')}</p>
                        <p>Conditions: {getWeatherDescription(weatherData.forecast!.weatherCodes[index])}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}