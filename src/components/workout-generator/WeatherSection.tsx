import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MapPin } from "lucide-react";
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

  const handleLocationSearch = async () => {
    if (!location) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-weather", {
        body: { query: location },
      });

      if (error) {
        console.error("Error fetching weather data:", error);
        return;
      }

      if (data) {
        const weatherDescription = getWeatherDescription(data.weatherCode);
        onWeatherUpdate(data, `The weather in ${data.location} is ${weatherDescription} with a temperature of ${data.temperature}°C.`);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
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
      <div className="flex gap-2">
        <Input
          placeholder="Enter your location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleLocationSearch} disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Weather"}
        </Button>
      </div>
      {weatherData && (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Current Weather:</p>
              <p>Temperature: {weatherData.temperature}°C</p>
              <p>Feels like: {weatherData.apparentTemperature}°C</p>
              <p>Humidity: {weatherData.humidity}%</p>
              <p>Wind Speed: {weatherData.windSpeed} km/h</p>
              <p>Wind Direction: {weatherData.windDirection}°</p>
              <p>Wind Gusts: {weatherData.windGusts} km/h</p>
              <p>Conditions: {getWeatherDescription(weatherData.weatherCode)}</p>
            </div>
            {weatherData.forecast && (
              <div>
                <p className="font-medium">Forecast:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {weatherData.forecast.dates.map((date, index) => (
                    <div key={date} className="text-sm">
                      <p className="font-medium">{new Date(date).toLocaleDateString()}</p>
                      <p>High: {weatherData.forecast!.maxTemps[index]}°C</p>
                      <p>Low: {weatherData.forecast!.minTemps[index]}°C</p>
                      <p>Precipitation: {weatherData.forecast!.precipitationProb[index]}%</p>
                      <p>Conditions: {getWeatherDescription(weatherData.forecast!.weatherCodes[index])}</p>
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